"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import {
  ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp,
  ArrowUpLeft, ArrowUpRight, Bookmark, Check, ChevronDown, Code2, Copy,
  Download, Layers2, Palette, Plus, Search, SlidersHorizontal, Sparkles,
  Trash2, Type, WandSparkles,
} from "lucide-react";
import { normalizeHex, uid } from "@/lib/color";
import { createGradient, gradientCss, GRADIENT_MODES } from "@/lib/gradient";
import { GRADIENT_PRESETS } from "@/lib/presets";
import type { CopyValue, Gradient, GradientMode, GradientStop, GradientType, Notify } from "@/types";
import "./gradient-forge.css";

interface GradientForgeProps {
  gradient: Gradient;
  onChange: (gradient: Gradient) => void;
  onGenerate: (mode: GradientMode) => void;
  onSave: () => void;
  onExport: () => void;
  onExtract: () => void;
  copy: CopyValue;
  notify: Notify;
}

const TYPES: { value: GradientType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
  { value: "conic", label: "Conic" },
];
const DIRECTIONS = [
  { angle: 315, Icon: ArrowUpLeft, label: "Top left" },
  { angle: 0, Icon: ArrowUp, label: "Up" },
  { angle: 45, Icon: ArrowUpRight, label: "Top right" },
  { angle: 270, Icon: ArrowLeft, label: "Left" },
  { angle: 90, Icon: ArrowRight, label: "Right" },
  { angle: 225, Icon: ArrowDownLeft, label: "Bottom left" },
  { angle: 180, Icon: ArrowDown, label: "Down" },
  { angle: 135, Icon: ArrowDownRight, label: "Bottom right" },
];
const POSITIONS = ["top left", "top", "top right", "left", "center", "right", "bottom left", "bottom", "bottom right"];
const CATEGORIES = ["All collections", ...new Set(GRADIENT_PRESETS.map((preset) => preset.category))];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function HexInput({ color, onCommit, notify }: { color: string; onCommit: (color: string) => void; notify: Notify }) {
  const [value, setValue] = useState(color);
  const cancelCommit = useRef(false);
  function commit() {
    if (cancelCommit.current) { cancelCommit.current = false; return; }
    const normalized = normalizeHex(value);
    if (!normalized) {
      setValue(color);
      notify("Enter a valid HEX color, like #7C3AED", "error");
      return;
    }
    setValue(normalized);
    if (normalized !== color) onCommit(normalized);
  }
  return <input className="gf-hex-input mono" aria-label="Selected stop HEX color" value={value} maxLength={7}
    spellCheck={false} onChange={(event) => setValue(event.target.value)} onBlur={commit}
    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { cancelCommit.current = true; setValue(color); event.currentTarget.blur(); } }} />;
}

export default function GradientForge({ gradient, onChange, onGenerate, onSave, onExport, onExtract, copy, notify }: GradientForgeProps) {
  const [mode, setMode] = useState<GradientMode>("Smooth");
  const [selectedId, setSelectedId] = useState(gradient.stops[0].id);
  const [textVisible, setTextVisible] = useState(true);
  const [codeTab, setCodeTab] = useState<"CSS" | "Tailwind" | "Value">("CSS");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All collections");
  const track = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = gradient.stops.find((stop) => stop.id === selectedId) ?? gradient.stops[0];
  const selectedIndex = gradient.stops.findIndex((stop) => stop.id === selected.id);
  const value = gradientCss(gradient);
  const tailwind = `bg-[${value.replace(/\s+/g, "_")}]`;
  const code = codeTab === "Tailwind" ? tailwind : codeTab === "Value" ? value : `background: ${value};`;
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopTrack = `linear-gradient(90deg, ${sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(", ")})`;
  const filteredPresets = GRADIENT_PRESETS.filter((preset) =>
    (category === "All collections" || preset.category === category) &&
    `${preset.name} ${preset.category}`.toLowerCase().includes(query.toLowerCase()));
  const shownPresets = expanded ? filteredPresets : GRADIENT_PRESETS.slice(0, 6);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  function updateStop(id: string, updates: Partial<GradientStop>) {
    onChange({ ...gradient, stops: gradient.stops.map((stop) => stop.id === id ? { ...stop, ...updates } : stop) });
  }

  function addStop() {
    if (gradient.stops.length >= 8) return;
    let gapStart = 0;
    let gapEnd = sortedStops[0].position;
    for (let i = 0; i < sortedStops.length - 1; i++) {
      if (sortedStops[i + 1].position - sortedStops[i].position > gapEnd - gapStart) {
        gapStart = sortedStops[i].position;
        gapEnd = sortedStops[i + 1].position;
      }
    }
    if (100 - sortedStops[sortedStops.length - 1].position > gapEnd - gapStart) {
      gapStart = sortedStops[sortedStops.length - 1].position;
      gapEnd = 100;
    }
    const position = Math.round((gapStart + gapEnd) / 2);
    const left = [...sortedStops].reverse().find((stop) => stop.position <= position) ?? sortedStops[0];
    const right = sortedStops.find((stop) => stop.position >= position) ?? sortedStops[sortedStops.length - 1];
    const mix = right.position === left.position ? 0 : (position - left.position) / (right.position - left.position);
    const color = "#" + [1, 3, 5].map((offset) => {
      const start = parseInt(left.color.slice(offset, offset + 2), 16);
      const end = parseInt(right.color.slice(offset, offset + 2), 16);
      return Math.round(start + (end - start) * mix).toString(16).padStart(2, "0");
    }).join("").toUpperCase();
    const stop = { id: uid(), color, position };
    onChange({ ...gradient, stops: [...gradient.stops, stop] });
    setSelectedId(stop.id);
  }

  function moveStop(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !track.current) return;
    const bounds = track.current.getBoundingClientRect();
    const position = clamp(Math.round(((event.clientX - bounds.left) / bounds.width) * 100), 0, 100);
    updateStop(id, { position });
  }

  function onStopKey(event: KeyboardEvent<HTMLButtonElement>, stop: GradientStop) {
    const step = event.shiftKey ? 10 : 1;
    const positions: Record<string, number> = {
      ArrowLeft: stop.position - step, ArrowDown: stop.position - step,
      ArrowRight: stop.position + step, ArrowUp: stop.position + step, Home: 0, End: 100,
    };
    if (event.key in positions) {
      event.preventDefault();
      updateStop(stop.id, { position: clamp(positions[event.key], 0, 100) });
    }
  }

  async function copyCode() {
    await copy(code, codeTab === "CSS" ? "CSS copied" : codeTab === "Tailwind" ? "Tailwind class copied" : "Gradient value copied");
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="gf-workspace" aria-label="Gradient Forge editor">
      <div className="gf-section-header">
        <div className="gf-heading-block"><div className="eyebrow gf-workspace-label"><span /> YOUR GRADIENT WORKSPACE</div><h2>Gradient Forge<span className="gf-beta">LIVE</span></h2><p>Find your flow. Make something extraordinary.</p></div>
        <div className="gf-forge-actions">
          <div className="gf-mode-wrap"><WandSparkles size={14} /><select className="select gf-mode-select" aria-label="Gradient generation mode" value={mode} onChange={(event) => setMode(event.target.value as GradientMode)}>{GRADIENT_MODES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <button className="button button-primary gf-forge-button" onClick={() => onGenerate(mode)}><Sparkles size={16} /> Forge gradient <kbd>G</kbd></button>
        </div>
      </div>

      <div className="gf-editor-grid">
        <div className="gf-preview-column">
          <div className="gf-preview" style={{ background: value }} aria-label={`${gradient.type} gradient preview`}>
            <div className="gf-preview-top"><span className="gf-preview-label"><span /> LIVE CANVAS</span><button className={`gf-canvas-button ${textVisible ? "is-active" : ""}`} title="Toggle preview text" aria-label="Toggle preview text" aria-pressed={textVisible} onClick={() => setTextVisible(!textVisible)}><Type size={16} /></button></div>
            {textVisible && <div className="gf-canvas-type"><span className="gf-canvas-kicker">THE POSSIBILITIES ARE ENDLESS.</span><p>Made to<br /><span>stand out.</span></p><span className="gf-canvas-tagline">A fresh perspective, one color at a time.</span></div>}
            <div className="gf-preview-bottom"><span className="gf-canvas-coordinate">{gradient.type.toUpperCase()} <span>/</span> {gradient.type === "radial" ? gradient.shape.toUpperCase() : `${gradient.angle}°`}</span><div className="gf-canvas-swatches" aria-hidden="true">{sortedStops.map((stop) => <i key={stop.id} style={{ backgroundColor: stop.color }} />)}</div></div>
            <span className="gf-preview-grain" aria-hidden="true" />
          </div>

          <div className="gf-stops-editor">
            <div className="gf-control-heading"><h3>Color stops <span>{gradient.stops.length}</span></h3><button className="button button-ghost gf-add-stop" onClick={addStop} disabled={gradient.stops.length >= 8} title={gradient.stops.length >= 8 ? "Maximum of 8 stops" : "Add a color stop"}><Plus size={14} /> Add stop</button></div>
            <div className="gf-track-container">
              <div className="gf-stop-track" ref={track} style={{ background: stopTrack }}>
                {gradient.stops.map((stop, index) => <button key={stop.id} type="button" className={`gf-stop-handle ${selected.id === stop.id ? "is-selected" : ""}`} style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
                  role="slider" aria-label={`Color stop ${index + 1}: ${stop.color}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stop.position} aria-valuetext={`${stop.position} percent`} title={`Stop ${index + 1} · ${stop.color} · ${stop.position}%`}
                  onFocus={() => setSelectedId(stop.id)} onClick={() => setSelectedId(stop.id)}
                  onPointerDown={(event) => { event.preventDefault(); setSelectedId(stop.id); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); }}
                  onPointerMove={(event) => moveStop(event, stop.id)} onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
                  onKeyDown={(event) => onStopKey(event, stop)}><span>{index + 1}</span></button>)}
              </div>
              <div className="gf-track-scale" aria-hidden="true"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
            </div>
            <div className="gf-stop-detail">
              <span className="gf-stop-number">Stop {String(selectedIndex + 1).padStart(2, "0")}</span>
              <div className="gf-color-field"><span className="gf-native-picker" style={{ background: selected.color }}><input type="color" aria-label="Pick selected stop color" value={selected.color} onChange={(event) => updateStop(selected.id, { color: event.target.value.toUpperCase() })} /></span><HexInput key={`${selected.id}-${selected.color}`} color={selected.color} onCommit={(color) => updateStop(selected.id, { color })} notify={notify} /><button className="gf-field-copy" aria-label="Copy selected stop HEX" title="Copy HEX" onClick={() => copy(selected.color, "HEX copied")}><Copy size={13} /></button></div>
              <label className="gf-position-field"><input type="number" aria-label="Selected stop position" min={0} max={100} value={selected.position} onChange={(event) => { if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber)) updateStop(selected.id, { position: clamp(Math.round(event.target.valueAsNumber), 0, 100) }); }} /><span>%</span></label>
              <button className="icon-button gf-remove-stop" aria-label="Delete selected color stop" title={gradient.stops.length <= 2 ? "A gradient needs at least 2 stops" : "Delete selected stop"} disabled={gradient.stops.length <= 2} onClick={() => { onChange({ ...gradient, stops: gradient.stops.filter((stop) => stop.id !== selected.id) }); notify("Color stop removed"); }}><Trash2 size={15} /></button>
            </div>
            <p className="gf-stop-hint">Drag a stop to adjust its position. Use arrow keys for precision.</p>
          </div>
        </div>

        <aside className="gf-inspector" aria-label="Gradient settings">
          <div className="gf-inspector-title"><SlidersHorizontal size={15} /><h3>Fine-tune your gradient</h3></div>
          <div className="gf-control-group"><label className="gf-field-label">Gradient type</label><div className="gf-type-tabs" role="group" aria-label="Gradient type">{TYPES.map((type) => <button key={type.value} className={gradient.type === type.value ? "is-active" : ""} aria-pressed={gradient.type === type.value} onClick={() => onChange({ ...gradient, type: type.value })}><i className={`gf-type-icon gf-type-${type.value}`} />{type.label}</button>)}</div></div>

          {gradient.type !== "radial" && <div className="gf-control-group gf-angle-group"><div className="gf-field-line"><label htmlFor="gf-angle-range" className="gf-field-label">{gradient.type === "conic" ? "Starting angle" : "Direction & angle"}</label><span className="gf-small-mono">0—360°</span></div><div className="gf-angle-controls"><div className="gf-angle-dial" aria-hidden="true"><span className="gf-dial-guide" /><span className="gf-dial-arrow" style={{ transform: `rotate(${gradient.angle}deg)` }}><ArrowUp size={27} strokeWidth={1.5} /></span><span className="gf-dial-center" /></div><label className="gf-angle-input"><input type="number" aria-label="Gradient angle in degrees" value={gradient.angle} min={0} max={360} onChange={(event) => { if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber)) onChange({ ...gradient, angle: clamp(Math.round(event.target.valueAsNumber), 0, 360) }); }} /><span>deg</span></label></div><input className="gf-angle-range" id="gf-angle-range" type="range" min={0} max={360} value={gradient.angle} onChange={(event) => onChange({ ...gradient, angle: Number(event.target.value) })} style={{ "--range-progress": `${gradient.angle / 3.6}%` } as CSSProperties} />{gradient.type === "linear" && <div className="gf-directions" aria-label="Direction presets">{DIRECTIONS.map(({ angle, Icon, label }) => <button key={angle} title={`${label} · ${angle}°`} aria-label={`${label}, ${angle} degrees`} aria-pressed={gradient.angle === angle} className={gradient.angle === angle ? "is-active" : ""} onClick={() => onChange({ ...gradient, angle })}><Icon size={16} /></button>)}</div>}</div>}

          {gradient.type === "radial" && <div className="gf-control-group"><span className="gf-field-label">Shape</span><div className="gf-shape-tabs" role="group" aria-label="Radial shape">{(["circle", "ellipse"] as const).map((shape) => <button className={gradient.shape === shape ? "is-active" : ""} aria-pressed={gradient.shape === shape} key={shape} onClick={() => onChange({ ...gradient, shape })}><i className={`gf-shape-icon gf-shape-${shape}`} />{shape}</button>)}</div></div>}

          {gradient.type !== "linear" && <div className="gf-control-group gf-center-group"><div><span className="gf-field-label">Center position</span><span className="gf-position-name">{gradient.position}</span></div><div className="gf-center-grid" role="group" aria-label="Gradient center position">{POSITIONS.map((position) => <button key={position} title={position} aria-label={`Center position: ${position}`} aria-pressed={gradient.position === position} className={gradient.position === position ? "is-active" : ""} onClick={() => onChange({ ...gradient, position })}><span /></button>)}</div></div>}

          <div className="gf-inspector-note"><Layers2 size={16} /><p>Good colors are just the start.<br /><span>Make them work together.</span></p></div>
          <div className="gf-inspector-actions"><button className="button gf-save-button" onClick={onSave}><Bookmark size={15} /> Save gradient</button><button className="icon-button gf-export-button" title="Export gradient" aria-label="Export gradient" onClick={onExport}><Download size={16} /></button></div><button className="gf-extract-button" onClick={onExtract}><Palette size={14} /> Extract to ColorLab <ArrowUpRight size={13} /></button>
        </aside>
      </div>

      <div className="gf-code-panel">
        <div className="gf-code-header"><div className="gf-code-heading"><Code2 size={15} /><span>Ready for your next project</span></div><div className="gf-code-actions"><div className="gf-code-tabs" role="group" aria-label="Code output format">{(["CSS", "Tailwind", "Value"] as const).map((tab) => <button key={tab} className={codeTab === tab ? "is-active" : ""} aria-pressed={codeTab === tab} onClick={() => { setCodeTab(tab); setCopied(false); }}>{tab}</button>)}</div><button className={`button gf-copy-code ${copied ? "is-copied" : ""}`} onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />}<span>{copied ? "Copied!" : `Copy ${codeTab === "Value" ? "value" : codeTab}`}</span></button></div></div>
        <pre className="gf-code"><code>{codeTab === "CSS" ? <><span className="gf-code-property">background</span><span className="gf-code-punctuation">: </span><span>{value}</span><span className="gf-code-punctuation">;</span></> : code}</code></pre>
      </div>

      <section className="gf-presets" aria-label="Gradient presets"><div className="gf-presets-header"><div><h3>A little inspiration<span>{GRADIENT_PRESETS.length} PRESETS</span></h3><p>A curated collection to get your ideas flowing.</p></div><button className="button button-ghost gf-library-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Less inspiration" : "Explore library"}<ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : undefined }} /></button></div>
        {expanded && <div className="gf-preset-filters"><label className="gf-search"><Search size={15} /><input type="search" placeholder="Find your next gradient…" aria-label="Search gradient presets" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select className="select gf-category" aria-label="Filter gradient category" value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><span className="gf-result-count">{filteredPresets.length} results</span></div>}
        <div className="gf-preset-grid">{shownPresets.map((preset) => { const active = gradient.type === "linear" && gradient.angle === preset.angle && gradient.stops.length === preset.colors.length && gradient.stops.every((stop, index) => stop.color.toLowerCase() === preset.colors[index].toLowerCase()); return <button className={`gf-preset ${active ? "is-active" : ""}`} key={preset.name} aria-label={`Apply ${preset.name} gradient preset`} onClick={() => { const next = createGradient(preset.colors, preset.angle); onChange(next); setSelectedId(next.stops[0].id); notify(`${preset.name} applied`); }}><span className="gf-preset-preview" style={{ background: `linear-gradient(${preset.angle}deg, ${preset.colors.join(", ")})` }}>{active && <span className="gf-preset-check"><Check size={13} /></span>}<span className="gf-preset-arrow"><ArrowUpRight size={16} /></span></span><span className="gf-preset-name">{preset.name}<span className="gf-preset-dots" aria-hidden="true">{preset.colors.slice(0, 3).map((color, index) => <i key={index} style={{ background: color }} />)}</span></span></button>; })}</div>
        {expanded && filteredPresets.length === 0 && <div className="gf-preset-empty"><Search size={22} /><p>No gradients match that search.</p><button className="button button-ghost" onClick={() => { setQuery(""); setCategory("All collections"); }}>Clear filters</button></div>}
      </section>
    </section>
  );
}
