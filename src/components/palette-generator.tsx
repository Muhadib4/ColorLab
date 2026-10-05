"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Dices, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react";
import { colorName, hexToHsl, hexToRgb, textColor } from "@/lib/color";
import { BASE_COLORS, generateColorVariations, generateHarmonicPalette, type BaseColor, type GeneratedColor } from "@/lib/palette-generator";
import type { CopyValue, Notify, Palette } from "@/types";
import { uid } from "@/lib/color";

interface PaletteGeneratorProps { onUsePalette: (palette: Palette) => void; copy: CopyValue; notify: Notify }
const MAX_COLORS = 12;
const initialBaseIds = BASE_COLORS.slice(0, 4).map(color => color.id);

function ColorDetails({ color, copy, copied, onCopy }: { color: GeneratedColor | BaseColor; copy: CopyValue; copied: boolean; onCopy: () => void }) {
  const rgb = hexToRgb(color.hex); const hsl = hexToHsl(color.hex);
  return <div className="pg-color-details"><strong>{"englishName" in color ? color.englishName : color.name}</strong><span className="mono">{color.hex}</span><small>RGB {rgb.r}, {rgb.g}, {rgb.b}</small><small>HSL {hsl.h}°, {hsl.s}%, {hsl.l}%</small><button className="pg-copy" onClick={() => { void copy(color.hex, "HEX copied"); onCopy(); }} aria-label={`Copy HEX ${color.hex}`}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy HEX"}</button></div>;
}

export default function PaletteGenerator({ onUsePalette, copy, notify }: PaletteGeneratorProps) {
  const [baseId, setBaseId] = useState<string | null>(null);
  const [selected, setSelected] = useState<GeneratedColor[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [mode, setMode] = useState<"Monochromatic" | "Analogous" | "Complementary" | "Triadic" | "Split Complementary">("Analogous");
  const base = BASE_COLORS.find(item => item.id === baseId) ?? null;
  const variations = useMemo(() => base ? generateColorVariations(base) : [], [base]);
  const visibleBases = showAll ? BASE_COLORS : BASE_COLORS.filter(item => initialBaseIds.includes(item.id));
  const selectedIds = new Set(selected.map(color => color.id));
  const chooseBase = (next: BaseColor) => { setBaseId(next.id); setSelected([]); setCopied(null); };
  const toggleColor = (color: GeneratedColor) => {
    if (selectedIds.has(color.id)) { setSelected(colors => colors.filter(item => item.id !== color.id)); return; }
    if (selected.length >= MAX_COLORS) { notify("Your palette is full. Remove a color before adding another.", "error"); return; }
    setSelected(colors => [...colors, color]);
  };
  const randomize = () => { if (!base) return; const generated = generateHarmonicPalette(base, mode); setSelected(generated.slice(0, MAX_COLORS)); notify(`${mode} palette generated from ${base.englishName}`); };
  const reset = () => { setBaseId(null); setSelected([]); setShowAll(false); setCopied(null); };
  const usePalette = () => { if (!selected.length) { notify("Select at least one color first.", "error"); return; } onUsePalette({ mode: "Random", colors: selected.map(color => ({ id: uid(), hex: color.hex, locked: false })) }); notify("Palette opened in ColorLab"); };
  return <div className="pg-workspace">
    <header className="pg-header"><div><span className="eyebrow">CREATE · PALETTE GENERATOR</span><h2>Start with one color.<br /><em>Explore the spectrum.</em></h2><p>Choose a base color, then build a palette from related tints, shades, tones, and harmonies.</p></div><button className="button button-ghost pg-reset" onClick={reset}><RotateCcw size={14} />Reset palette</button></header>
    <section className="pg-section"><div className="pg-section-heading"><div><span className="pg-step">01</span><div><h3>Choose a base color</h3><p>Pick one of four anchors, or browse all 30 colors.</p></div></div><button className="button button-ghost" onClick={() => setShowAll(value => !value)}>{showAll ? "Show featured" : "View all 30 colors"}<ChevronDown size={14} className={showAll ? "pg-chevron-up" : ""} /></button></div><div className={`pg-base-grid ${showAll ? "pg-base-grid-all" : ""}`}>{visibleBases.map(color => <button key={color.id} className={`pg-base-card ${baseId === color.id ? "selected" : ""}`} onClick={() => chooseBase(color)} aria-pressed={baseId === color.id}><span className="pg-base-swatch" style={{ background: color.hex, color: textColor(color.hex) }}><span className="mono">{color.hex}</span>{baseId === color.id && <span className="pg-check"><Check size={16} /></span>}</span><span className="pg-base-copy"><strong>{color.name}</strong><small>{color.englishName}</small></span></button>)}</div></section>
    {base ? <section className="pg-section pg-variations"><div className="pg-section-heading"><div><span className="pg-step">02</span><div><h3>Generate variations</h3><p>32 related colors generated from <strong>{base.englishName}</strong> using HSL color theory.</p></div></div><div className="pg-generation-actions"><select className="select" value={mode} onChange={event => setMode(event.target.value as typeof mode)} aria-label="Harmony mode"><option>Monochromatic</option><option>Analogous</option><option>Complementary</option><option>Triadic</option><option>Split Complementary</option></select><button className="button button-primary" onClick={randomize}><Dices size={15} />Generate palette</button></div></div><div className="pg-variation-grid">{variations.map(color => <button key={color.id} className={`pg-variation-card ${selectedIds.has(color.id) ? "selected" : ""}`} onClick={() => toggleColor(color)} aria-pressed={selectedIds.has(color.id)}><span className="pg-variation-swatch" style={{ background: color.hex, color: textColor(color.hex) }}>{selectedIds.has(color.id) ? <Check size={16} /> : <Sparkles size={13} />}</span><ColorDetails color={color} copy={copy} copied={copied === color.id} onCopy={() => { setCopied(color.id); setTimeout(() => setCopied(current => current === color.id ? null : current), 1300); }} /></button>)}</div></section> : <section className="pg-empty"><Sparkles size={21} /><h3>Your variations are waiting.</h3><p>Choose one of the featured colors above to generate its spectrum.</p></section>}
    <section className="pg-builder"><div className="pg-builder-heading"><div><span className="eyebrow">YOUR PALETTE</span><h3>{selected.length} <small>/ {MAX_COLORS} colors selected</small></h3></div><div className="pg-builder-actions"><button className="button button-ghost" disabled={!selected.length} onClick={() => setSelected([])}><Trash2 size={14} />Clear</button><button className="button button-primary" disabled={!selected.length} onClick={usePalette}><Send size={14} />Open in ColorLab</button></div></div>{selected.length ? <div className="pg-selected-list">{selected.map((color, index) => { const rgb = hexToRgb(color.hex); return <article key={color.id} className="pg-selected-card"><span className="pg-selected-swatch" style={{ background: color.hex }} /><div><strong>{index + 1}. {colorName(color.hex)}</strong><code>{color.hex}</code><small>RGB {rgb.r}, {rgb.g}, {rgb.b}</small></div><button className="icon-button" onClick={() => toggleColor(color)} aria-label={`Remove ${color.hex}`}><Trash2 size={14} /></button></article>})}</div> : <div className="pg-builder-empty">Select colors from the variation grid to build your palette. You can choose up to 12.</div>}</section>
  </div>;
}
