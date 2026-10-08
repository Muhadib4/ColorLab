"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Diamond, Eye, Layers3, LockKeyhole, Plus, SlidersHorizontal, Sparkles, Trash2, UnlockKeyhole, X } from "lucide-react";
import type { Color, ColorFormat, CopyValue, Notify, Palette, PaletteMode } from "@/types";
import { BASE_COLORS } from "@/lib/palette-generator";
import { MAX_PALETTE_COLORS, MIN_PALETTE_COLORS, PALETTE_COLOR_OPTIONS, PALETTE_MODES, colorName, colorScale, contrastRatio, formatColor, generatePalette, hexToHsv, luminance, normalizeHex, textColor, uid } from "@/lib/color";
import "./colorlab.css";

interface ColorLabProps {
  palette: Palette;
  onChange: (palette: Palette) => void;
  onGenerate: (sourceHex?: string) => void;
  onSave: () => void;
  onExport: () => void;
  onSendToGradient: (colors: string[]) => void;
  copy: CopyValue;
  notify: Notify;
  format: ColorFormat;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  selectedSeeds: string[];
  onSeedChange: (colors: string[]) => void;
}

interface HexFieldProps {
  value: string;
  label: string;
  onChange: (value: string) => void;
  notify: Notify;
}

function HexField({ value, label, onChange, notify }: HexFieldProps) {
  return <div className="cl-hex-field">
    <input type="color" value={value} aria-label={`${label} color picker`} onChange={event => onChange(event.target.value.toUpperCase())} />
    <input key={value} type="text" defaultValue={value} aria-label={`${label} HEX value`} className="mono" maxLength={7} spellCheck={false} autoComplete="off" onBlur={event => {
      const next = normalizeHex(event.target.value);
      if (next) { if (next !== value) onChange(next); event.target.value = next; }
      else { event.target.value = value; notify("Enter a valid HEX color, like #A78BFA", "error"); }
    }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  </div>;
}

function ColorInspector({ color, palette, onChange, onClose, copy, notify }: {
  color: Color; palette: Palette; onChange: (palette: Palette) => void; onClose: () => void; copy: CopyValue; notify: Notify;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [scale, setScale] = useState<"shades" | "tints" | "tones">("shades");
  const [customForeground, setCustomForeground] = useState<string | null>(null);
  const [background, setBackground] = useState("#FFFFFF");
  const foreground = customForeground ?? color.hex;
  const ratio = contrastRatio(foreground, background);
  const hsv = hexToHsv(color.hex);
  const index = palette.colors.findIndex(item => item.id === color.id);
  const update = (patch: Partial<Color>) => onChange({ ...palette, colors: palette.colors.map(item => item.id === color.id ? { ...item, ...patch } : item) });

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, []);

  return <dialog ref={dialog} className="cl-inspector" aria-labelledby="cl-inspector-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }
  }}>
    <div className="cl-inspector-header">
      <div><span className="eyebrow">COLOR INSPECTOR</span><h2 id="cl-inspector-title">A closer look.</h2></div>
      <button className="icon-button" onClick={onClose} aria-label="Close color inspector"><X size={19} /></button>
    </div>
    <div className="cl-inspector-body">
      <div className="cl-detail-summary">
        <div className="cl-detail-preview" style={{ background: color.hex, color: textColor(color.hex) }}>
          <span className="cl-detail-index mono">COLOR {String(index + 1).padStart(2, "0")}</span>
          <div><strong>{colorName(color.hex)}</strong><span className="mono">{color.hex}</span></div>
        </div>
        <div className="cl-detail-values">
          <label className="cl-field-label">Edit color</label>
          <HexField value={color.hex} label="Selected color" onChange={hex => update({ hex })} notify={notify} />
          {(["RGB", "HSL"] as const).map(valueFormat => <button className="cl-detail-copy" key={valueFormat} onClick={() => void copy(formatColor(color.hex, valueFormat), `${valueFormat} copied`)} aria-label={`Copy ${valueFormat} value`}><span>{valueFormat}</span><code>{formatColor(color.hex, valueFormat)}</code><Copy size={13} /></button>)}
          <div className="cl-detail-measurements"><span>HSV <code>{hsv.h}° {hsv.s}% {hsv.v}%</code></span><span>Luminance <code>{luminance(color.hex).toFixed(3)}</code></span></div>
        </div>
      </div>
      <div className="cl-detail-tools">
        <button className={`button button-ghost ${color.locked ? "cl-is-locked" : ""}`} aria-pressed={color.locked} onClick={() => { update({ locked: !color.locked }); notify(color.locked ? "Color unlocked" : "Color locked"); }}>{color.locked ? <LockKeyhole size={15} /> : <UnlockKeyhole size={15} />}{color.locked ? "Locked" : "Lock color"}</button>
        <button className="button button-ghost" onClick={() => void copy(color.hex, "HEX copied")}><Copy size={15} />Copy HEX</button>
        <button className="button button-ghost" disabled={palette.colors.length >= MAX_PALETTE_COLORS} onClick={() => {
          const colors = [...palette.colors]; colors.splice(index + 1, 0, { ...color, id: uid(), locked: false }); onChange({ ...palette, colors }); notify("Color duplicated");
        }}><Layers3 size={15} />Duplicate</button>
        <button className="button button-ghost cl-delete" disabled={palette.colors.length <= 3} onClick={() => { onChange({ ...palette, colors: palette.colors.filter(item => item.id !== color.id) }); onClose(); notify("Color removed"); }}><Trash2 size={15} />Remove</button>
      </div>
      <section className="cl-scale-section" aria-labelledby="cl-scale-title">
        <div className="cl-detail-section-title"><div><h3 id="cl-scale-title">Explore the spectrum</h3><p>Click any swatch to copy its HEX.</p></div><div className="cl-segmented" role="group" aria-label="Color scale type">{(["shades", "tints", "tones"] as const).map(kind => <button key={kind} aria-pressed={scale === kind} className={scale === kind ? "active" : ""} onClick={() => setScale(kind)}>{kind}</button>)}</div></div>
        <div className="cl-scale">{colorScale(color.hex, scale).map(item => <button key={item.label} onClick={() => void copy(item.hex, `${scale.slice(0, -1)} ${item.label} copied`)} aria-label={`Copy ${scale.slice(0, -1)} ${item.label}, ${item.hex}`} title={item.hex}><span style={{ background: item.hex }} /><code>{item.label}</code></button>)}</div>
      </section>
      <section className="cl-contrast-section" aria-labelledby="cl-contrast-title">
        <div className="cl-detail-section-title"><div><h3 id="cl-contrast-title"><Eye size={16} />Contrast checker</h3><p>WCAG contrast for normal text.</p></div><span className="cl-contrast-ratio mono">{ratio.toFixed(2)}<small>:1</small></span></div>
        <div className="cl-contrast-layout">
          <div className="cl-contrast-preview" style={{ background, color: foreground }}><span>Aa</span><p>Good design speaks clearly.</p></div>
          <div className="cl-contrast-controls">
            <div className="cl-contrast-field"><label className="cl-field-label">Foreground</label><HexField value={foreground} label="Contrast foreground" onChange={setCustomForeground} notify={notify} /></div>
            <div className="cl-contrast-field"><label className="cl-field-label">Background</label><HexField value={background} label="Contrast background" onChange={setBackground} notify={notify} /></div>
            <div className="cl-contrast-results"><span className={ratio >= 4.5 ? "cl-pass" : "cl-fail"}>{ratio >= 4.5 ? <Check size={13} /> : <X size={13} />}AA {ratio >= 4.5 ? "Pass" : "Fail"}<small>4.5:1</small></span><span className={ratio >= 7 ? "cl-pass" : "cl-fail"}>{ratio >= 7 ? <Check size={13} /> : <X size={13} />}AAA {ratio >= 7 ? "Pass" : "Fail"}<small>7:1</small></span></div>
          </div>
        </div>
        <p className="cl-contrast-note">{ratio >= 7 ? "Excellent contrast. This combination meets both AA and AAA for normal text." : ratio >= 4.5 ? "This combination meets AA for normal text. Aim for 7:1 to reach AAA." : "This combination needs more contrast for normal text. Increase the lightness difference between foreground and background."}</p>
      </section>
    </div>
    <div className="cl-inspector-footer"><span className="cl-footer-hint"><kbd>esc</kbd> to close</span><button className="button button-primary" onClick={onClose}>Done<Check size={15} /></button></div>
  </dialog>;
}

export default function ColorLab({ palette, onChange, onGenerate, onSave, onExport, onSendToGradient, copy, notify, format, selectedId, onSelect, selectedSeeds, onSeedChange }: ColorLabProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [customCount, setCustomCount] = useState<string | null>(null);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [copiedColor, setCopiedColor] = useState<{ id: string; format: ColorFormat } | null>(null);
  const [showGeneratorColors, setShowGeneratorColors] = useState(false);
  const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clampCount = (value: number) => Math.min(MAX_PALETTE_COLORS, Math.max(MIN_PALETTE_COLORS, Number.isFinite(value) ? Math.round(value) : MIN_PALETTE_COLORS));
  useEffect(() => () => { if (copyFeedbackTimeout.current) clearTimeout(copyFeedbackTimeout.current); }, []);
  const selected = palette.colors.find(color => color.id === selectedId);
  const checked = palette.colors.filter(color => checkedIds.includes(color.id));
  const lockedCount = palette.colors.filter(color => color.locked).length;
  const selectionCount = checked.length;
  const countIsPreset = PALETTE_COLOR_OPTIONS.includes(palette.colors.length as typeof PALETTE_COLOR_OPTIONS[number]);
  const countValue = isCustomCount || !countIsPreset ? "custom" : String(palette.colors.length);
  const customCountValue = customCount ?? String(palette.colors.length);
  const updateColor = (id: string, patch: Partial<Color>) => onChange({ ...palette, colors: palette.colors.map(color => color.id === id ? { ...color, ...patch } : color) });
  const copyColor = async (color: Color, colorFormat: ColorFormat) => {
    try {
      await copy(formatColor(color.hex, colorFormat), `${colorFormat} copied`);
      if (copyFeedbackTimeout.current) clearTimeout(copyFeedbackTimeout.current);
      setCopiedColor({ id: color.id, format: colorFormat });
      copyFeedbackTimeout.current = setTimeout(() => setCopiedColor(null), 1500);
    } catch {
      notify("Could not copy. Try again or select the value manually.", "error");
    }
  };
  const moveColor = (index: number, direction: number) => {
    const next = index + direction;
    if (next < 0 || next >= palette.colors.length) return;
    const colors = [...palette.colors];
    [colors[index], colors[next]] = [colors[next], colors[index]];
    onChange({ ...palette, colors });
  };
  const changeCount = (count: number) => {
    const nextCount = clampCount(count);
    const colors = generatePalette(nextCount, palette.mode, palette.colors, selectedSeeds).map((color, index) => ({ ...color, locked: palette.colors[index]?.locked ?? false }));
    onChange({ ...palette, colors });
  };

  return <div className="cl-workspace">
    <div className="cl-workspace-heading"><div className="cl-heading-label"><span className="cl-live-dot" /><h2>Your palette</h2><span className="cl-color-count mono">{palette.colors.length} colors</span></div><div className="cl-heading-actions"><button className="button button-ghost" onClick={onSave}><Plus size={15} />Save palette</button><button className="button button-ghost" onClick={onExport}><ArrowDownToLine size={15} />Export</button></div></div>
    <div className="cl-toolbar">
      <div className="cl-generator-options">
        <label className="cl-mode-control">
          <SlidersHorizontal size={15} />
          <span className="sr-only">Palette generation mode</span>
          <select
            className="select"
            aria-label="Palette generation mode"
            value={palette.mode}
            onChange={event => onChange({ ...palette, mode: event.target.value as PaletteMode })}
          >
            {PALETTE_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>

        <span className="cl-toolbar-divider" />

        <div className="cl-count-control">
          <label htmlFor="palette-color-count" className="sr-only">Number of colors</label>
          <select
            id="palette-color-count"
            className="select"
            aria-label="Number of colors"
            value={countValue}
            onChange={event => {
              if (event.target.value === "custom") {
                setIsCustomCount(true);
                setCustomCount(String(palette.colors.length));
                return;
              }
              setIsCustomCount(false);
              setCustomCount(null);
              changeCount(Number(event.target.value));
            }}
          >
            {PALETTE_COLOR_OPTIONS.map(count => <option key={count} value={count}>{count} colors</option>)}
            <option value="custom">Custom</option>
          </select>

          {countValue === "custom" && (
            <input
              className="cl-count-input mono"
              aria-label={`Custom color count, ${MIN_PALETTE_COLORS} to ${MAX_PALETTE_COLORS}`}
              type="number"
              min={MIN_PALETTE_COLORS}
              max={MAX_PALETTE_COLORS}
              step={1}
              value={customCountValue}
              onChange={event => setCustomCount(event.target.value)}
              onBlur={event => {
                const next = clampCount(Number(event.target.value));
                setCustomCount(null);
                setIsCustomCount(!PALETTE_COLOR_OPTIONS.includes(next as typeof PALETTE_COLOR_OPTIONS[number]));
                changeCount(next);
              }}
              onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
          )}
        </div>

        <div className="cl-generator-color-source">
          <button
            type="button"
            className="cl-generator-color-trigger"
            aria-expanded={showGeneratorColors}
            onClick={() => setShowGeneratorColors(value => !value)}
          >
            <span className="cl-generator-color-preview" style={{ background: selectedSeeds[0] ?? "#CBD5E1" }} />
            <span>
              <small>COLOR SEEDS</small>
              <strong>{selectedSeeds.length ? `${selectedSeeds.length}/4 selected` : "No color selected"}</strong>
            </span>
            <span className="mono">{selectedSeeds.length ? selectedSeeds.join(" · ") : "Optional"}</span>
          </button>

          {showGeneratorColors && (
            <div className="cl-generator-color-popover">
              <div className="cl-generator-color-head">
                <div>
                  <strong>Choose generator colors</strong>
                  <small>Pick up to 4 colors. Leave empty for a normal palette.</small>
                </div>
                <label className="cl-generator-custom">
                  <input
                    type="color"
                    value={selectedSeeds[0] ?? "#6366F1"}
                    onChange={event => {
                      const hex = event.target.value.toUpperCase();
                      if (selectedSeeds.includes(hex)) return;
                      if (selectedSeeds.length >= 4) { notify("You can use up to 4 seed colors.", "error"); return; }
                      onSeedChange([...selectedSeeds, hex]);
                    }}
                    aria-label="Add custom generator color"
                  />
                  <span>Add custom</span>
                </label>
              </div>

              <div className="cl-generator-color-grid">
                {BASE_COLORS.map(color => {
                  const selected = selectedSeeds.includes(color.hex);
                  return <button
                    type="button"
                    key={color.id}
                    className={`cl-generator-color-option ${selected ? "selected" : ""}`}
                    onClick={() => {
                      if (selected) onSeedChange(selectedSeeds.filter(hex => hex !== color.hex));
                      else if (selectedSeeds.length < 4) onSeedChange([...selectedSeeds, color.hex]);
                      else notify("You can use up to 4 seed colors.", "error");
                    }}
                    aria-pressed={selected}
                  >
                    <span className="cl-generator-color-swatch" style={{ background: color.hex }} />
                    <span>
                      <strong>{color.name}</strong>
                      <small>{color.englishName}</small>
                    </span>
                    <code>{selected ? "SELECTED" : color.hex}</code>
                  </button>;
                })}
              </div>

              {selectedSeeds.length > 0 && <button type="button" className="cl-subtle-button" onClick={() => onSeedChange([])}>
                Clear all color seeds
              </button>}
            </div>
          )}
        </div>      </div>

      <div className="cl-generate-actions">
        <span className="cl-seed-status" title="Selected colors are used as generator seeds">
          <span className="cl-seed-dots">
            {selectedSeeds.map(hex => <i key={hex} style={{ background: hex }} />)}
          </span>
          {selectedSeeds.length ? `${selectedSeeds.length}/4 seeds` : "Choose up to 4 seeds"}
        </span>

        <span className="cl-space-hint">or press <kbd>space</kbd></span>

        <button
          className="button button-primary cl-generate"
          onClick={() => onGenerate()}
        >
          <Sparkles size={16} />
          Generate palette
        </button>
      </div>
    </div>

    <div className={`cl-palette ${palette.colors.length > 8 ? "cl-palette-many" : ""}`} style={{ "--color-count": palette.colors.length } as CSSProperties}>
      {palette.colors.map((color, index) => {
        const ink = textColor(color.hex);
        const isChecked = checkedIds.includes(color.id);
        const isSeed = selectedSeeds.includes(color.hex);
        const isCopied = copiedColor?.id === color.id;
        const formatCopied = isCopied && copiedColor.format === format;
        return <article className={`cl-color-card ${isChecked ? "cl-checked" : ""} ${isSeed ? "cl-seed-selected" : ""} ${isCopied ? "cl-copy-flash" : ""}`} key={color.id} style={{ "--swatch-delay": `${index * 18}ms` } as CSSProperties}>
          <div className="cl-color-face" style={{ backgroundColor: color.hex, color: ink }}>
            <button className={`cl-select-color ${isChecked ? "is-checked" : ""}`} aria-label={`${isChecked ? "Deselect" : "Select"} ${color.hex} for Gradient Forge`} aria-pressed={isChecked} onClick={() => setCheckedIds(ids => { const currentIds = ids.filter(id => palette.colors.some(item => item.id === id)); return currentIds.includes(color.id) ? currentIds.filter(id => id !== color.id) : [...currentIds, color.id]; })}>{isChecked ? <Check size={14} strokeWidth={2.5} /> : <span className="mono">{String(index + 1).padStart(2, "0")}</span>}</button>
            <button className={`cl-seed-button ${isSeed ? "is-seed" : ""}`} aria-label={`${isSeed ? "Remove" : "Use"} ${color.hex} as generator seed`} aria-pressed={isSeed} title={isSeed ? "Remove generator seed" : "Use as generator seed"} onClick={() => { if (isSeed) onSeedChange(selectedSeeds.filter(hex => hex !== color.hex)); else if (selectedSeeds.length < 4) onSeedChange([...selectedSeeds, color.hex]); else notify("You can use up to 4 seed colors.", "error"); }}>{isSeed ? <Check size={13} strokeWidth={2.5} /> : <Sparkles size={13} />}</button>
            <button className={`cl-lock-button ${color.locked ? "is-locked" : ""}`} onClick={() => { updateColor(color.id, { locked: !color.locked }); notify(color.locked ? "Color unlocked" : "Color locked"); }} aria-label={`${color.locked ? "Unlock" : "Lock"} ${color.hex}`} aria-pressed={color.locked} title={color.locked ? "Unlock color" : "Lock this color"}>{color.locked ? <LockKeyhole size={16} /> : <UnlockKeyhole size={16} />}</button>
            <button className="cl-color-inspect" onClick={() => onSelect(color.id)} aria-label={`Inspect ${colorName(color.hex)}, ${color.hex}`}><span className="cl-color-open"><ArrowUpRight size={23} /></span><span className="cl-color-identity"><span className="cl-color-name">{colorName(color.hex)}</span><strong className="mono">{format === "HEX" ? color.hex.slice(1) : color.hex}</strong></span></button>
            <div className="cl-swatch-tools"><button aria-label={`Move ${color.hex} left`} title="Move left" disabled={index === 0} onClick={() => moveColor(index, -1)}><ArrowLeft size={14} /></button><button className="cl-swatch-copy" onClick={() => void copyColor(color, format)} aria-label={formatCopied ? `${format} copied` : `Copy ${format} for ${color.hex}`}>{formatCopied ? <Check size={13} /> : <Copy size={12} />}<span>{formatCopied ? "Copied" : `Copy ${format}`}</span></button><button aria-label={`Move ${color.hex} right`} title="Move right" disabled={index === palette.colors.length - 1} onClick={() => moveColor(index, 1)}><ArrowRight size={14} /></button></div>
          </div>
          <div className="cl-color-values">{(["HEX", "RGB", "HSL"] as const).map(valueFormat => <button key={valueFormat} className={isCopied && copiedColor.format === valueFormat ? "cl-value-copied" : ""} onClick={() => void copyColor(color, valueFormat)} title={`Copy ${valueFormat}`} aria-label={`Copy ${valueFormat} ${formatColor(color.hex, valueFormat)}`}><span>{valueFormat}</span><code>{valueFormat === "HEX" ? color.hex : formatColor(color.hex, valueFormat).replace(/^(rgb|hsl)\(/, "").replace(/\)$/, "")}</code>{isCopied && copiedColor.format === valueFormat ? <Check size={11} /> : <Copy size={11} />}</button>)}</div>
        </article>;
      })}
    </div>

    <div className="cl-palette-footer"><p><LockKeyhole size={13} />{lockedCount > 0 ? `${lockedCount} color${lockedCount > 1 ? "s" : ""} locked. Your keepers stay put.` : "Found a keeper? Lock it and keep exploring."}</p><button className="cl-subtle-button" onClick={() => { const allSelected = checked.length === palette.colors.length; setCheckedIds(allSelected ? [] : palette.colors.map(color => color.id)); }}>{checked.length === palette.colors.length ? "Deselect all" : "Select all"}</button></div>

    <div className="cl-forge-banner"><div className="cl-forge-mark" style={{ background: `linear-gradient(140deg, ${palette.colors.map(color => color.hex).join(", ")})` }}><Diamond size={21} /></div><div className="cl-forge-copy"><h3>Great colors. Even better together.</h3><p>Turn {selectionCount ? `your ${selectionCount} selected color${selectionCount > 1 ? "s" : ""}` : "this palette"} into something fluid.</p></div><button className="button cl-send-button" disabled={selectionCount === 1} title={selectionCount === 1 ? "Select at least two colors, or deselect to send the full palette" : undefined} onClick={() => onSendToGradient((selectionCount ? checked : palette.colors).map(color => color.hex))}><span>Send to Gradient Forge</span><ArrowUpRight size={16} /></button>{selectionCount === 1 && <span className="cl-selection-note">Select one more color to make a gradient.</span>}</div>

    <div className="cl-workspace-note"><span><span className="cl-note-dot" />Made to explore. Ready to ship.</span><span>Click a color to inspect <span className="cl-note-separator">·</span> Select its number to combine</span></div>
    {selected && <ColorInspector key={selected.id} color={selected} palette={palette} onChange={onChange} onClose={() => onSelect(null)} copy={copy} notify={notify} />}
  </div>;
}
