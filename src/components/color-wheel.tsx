"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, Send, Shuffle, Sparkles } from "lucide-react";
import { formatColor, hexToHsl, hslToHex, textColor, uid } from "@/lib/color";
import type { CopyValue, Notify, Palette } from "@/types";

type Harmony = "Monochromatic" | "Analogous" | "Complementary" | "Split-Complementary" | "Triadic" | "Tetradic" | "Square" | "Diadic" | "Double Complementary" | "Accented Analogous" | "Shades" | "Tints" | "Tones" | "Warm" | "Cool";
const HARMONIES: Harmony[] = ["Monochromatic", "Analogous", "Complementary", "Split-Complementary", "Triadic", "Tetradic", "Square", "Diadic", "Double Complementary", "Accented Analogous", "Shades", "Tints", "Tones", "Warm", "Cool"];
const OFFSETS: Record<Harmony, number[]> = {
  Monochromatic: [0, 0, 0, 0], Analogous: [-30, -15, 0, 15], Complementary: [0, 180], "Split-Complementary": [0, 150, 210], Triadic: [0, 120, 240], Tetradic: [0, 60, 180, 240], Square: [0, 90, 180, 270], Diadic: [0, 60], "Double Complementary": [0, 30, 180, 210], "Accented Analogous": [0, 30, 60, 180], Shades: [0, 0, 0, 0], Tints: [0, 0, 0, 0], Tones: [0, 0, 0, 0], Warm: [-18, 0, 18, 36], Cool: [165, 195, 225, 255],
};

const WHEEL_TEMPLATES: { name: string; tag: string; base: string; harmony: Harmony }[] = [
  { name: "Midnight Bloom", tag: "Dark", base: "#6366F1", harmony: "Complementary" },
  { name: "Aurora Field", tag: "Aurora", base: "#14B8A6", harmony: "Analogous" },
  { name: "Cyber Pulse", tag: "Neon", base: "#A855F7", harmony: "Triadic" },
  { name: "Ocean Depth", tag: "Ocean", base: "#0891B2", harmony: "Tetradic" },
  { name: "Sunset Heat", tag: "Warm", base: "#F97316", harmony: "Split-Complementary" },
  { name: "Forest Moss", tag: "Nature", base: "#65A30D", harmony: "Analogous" },
  { name: "Rose Quartz", tag: "Pastel", base: "#EC4899", harmony: "Complementary" },
  { name: "Electric Lime", tag: "Vibrant", base: "#84CC16", harmony: "Square" },
  { name: "Lavender Haze", tag: "Soft", base: "#8B5CF6", harmony: "Tetradic" },
  { name: "Arctic Sky", tag: "Cool", base: "#38BDF8", harmony: "Diadic" },
];

interface Props { onUsePalette: (palette: Palette) => void; copy: CopyValue; notify: Notify }

export default function ColorWheel({ onUsePalette, copy, notify }: Props) {
  const [base, setBase] = useState("#6366F1");
  const [harmony, setHarmony] = useState<Harmony>("Complementary");
  const [dragging, setDragging] = useState(false);
  const activeHandle = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const hsl = hexToHsl(base);

  const colors = useMemo(() => OFFSETS[harmony].map((offset, index) => {
    let saturation = hsl.s;
    let lightness = hsl.l;
    if (harmony === "Monochromatic") lightness = Math.max(8, Math.min(92, hsl.l + [-24, -8, 10, 25][index]));
    if (harmony === "Shades") { saturation = Math.min(100, hsl.s + 5); lightness = Math.max(5, hsl.l - index * 14); }
    if (harmony === "Tints") lightness = Math.min(96, hsl.l + index * 14);
    if (harmony === "Tones") { saturation = Math.max(8, hsl.s - 12); lightness = Math.max(8, Math.min(92, hsl.l + [-16, -5, 7, 18][index])); }
    return hslToHex(hsl.h + offset, saturation, lightness);
  }), [harmony, hsl.h, hsl.l, hsl.s]);

  const wheelAngles = useMemo(() => OFFSETS[harmony].map(offset => (hsl.h + offset + 360) % 360), [harmony, hsl.h]);

  const setBaseFromAngle = (angle: number, offset = 0) => {
    setBase(hslToHex(angle - offset, hsl.s || 70, hsl.l || 55));
  };

  const getAngleFromPointer = (event: React.PointerEvent<HTMLElement>) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return hsl.h;
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>, handleIndex = 0) => {
    event.preventDefault();
    activeHandle.current = handleIndex;
    setDragging(true);
    wheelRef.current?.setPointerCapture(event.pointerId);
    setBaseFromAngle(getAngleFromPointer(event), OFFSETS[harmony][handleIndex]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragging || activeHandle.current === null) return;
    setBaseFromAngle(getAngleFromPointer(event), OFFSETS[harmony][activeHandle.current]);
  };

  const stopDragging = (event: React.PointerEvent<HTMLElement>) => {
    if (activeHandle.current === null) return;
    activeHandle.current = null;
    setDragging(false);
    if (wheelRef.current?.hasPointerCapture(event.pointerId)) wheelRef.current.releasePointerCapture(event.pointerId);
  };

  const randomize = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 58 + Math.floor(Math.random() * 34);
    const lightness = 42 + Math.floor(Math.random() * 22);
    setBase(hslToHex(hue, saturation, lightness));
    setHarmony(HARMONIES[Math.floor(Math.random() * HARMONIES.length)]);
    notify("New random harmony generated");
  };

  const applyTemplate = (template: (typeof WHEEL_TEMPLATES)[number]) => {
    setBase(template.base);
    setHarmony(template.harmony);
    notify(`Loaded template: ${template.name}`);
  };

  const useAsPalette = () => {
    onUsePalette({ mode: harmony === "Split-Complementary" ? "Split Complementary" : harmony === "Accented Analogous" ? "Analogous" : harmony === "Double Complementary" ? "Tetradic" : harmony as Palette["mode"], colors: colors.slice(0, 4).map(hex => ({ id: uid(), hex, locked: false })) });
    notify("Harmony added to your palette");
  };

  return <section className="wheel-workspace">
    <div className="wheel-intro">
      <div>
        <span className="eyebrow">COLOR WHEEL · HARMONY LAB</span>
        <h2>Find the relationship between colors.</h2>
        <p>Drag any color handle around the wheel to explore the harmony. Pick a scheme, randomize it, or start from a template.</p>
      </div>
      <div className="wheel-intro-actions">
        <button className="button button-ghost wheel-random-button" onClick={randomize}><Shuffle size={14} />Randomize</button>
        <button className="button button-primary" onClick={useAsPalette}><Send size={15} />Use as Palette</button>
      </div>
    </div>

    <div className="wheel-layout">
      <div className="wheel-panel">
        <div
          ref={wheelRef}
          className={`color-wheel ${dragging ? "is-dragging" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          role="slider"
          tabIndex={0}
          aria-label="Interactive color wheel. Drag a harmony handle to change the base hue."
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={Math.round(hsl.h)}
          style={{ "--wheel-angle": `${hsl.h}deg` } as React.CSSProperties}
        >
          {wheelAngles.map((angle, index) => (
            <div
              key={`${angle}-${index}`}
              className={`wheel-ray ${index === 0 ? "is-base" : ""}`}
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <button
                className={`wheel-harmony-handle ${index === 0 ? "is-base" : ""}`}
                style={{ background: colors[index], color: textColor(colors[index]) }}
                onPointerDown={event => {
                  event.stopPropagation();
                  handlePointerDown(event, index);
                }}
                onClick={event => event.stopPropagation()}
                title={`${colors[index]} · Drag to rotate`}
                aria-label={`Harmony color ${colors[index]}. Drag to rotate.`}
              >
                <span>{index + 1}</span>
              </button>
            </div>
          ))}
          <span className="wheel-core" style={{ background: base, color: textColor(base) }}>{base}</span>
        </div>

        <div className="wheel-legend">
          <span><i className="legend-line" />Drag the numbered handles</span>
          <span><Sparkles size={12} />Realtime harmony</span>
        </div>

        <label className="wheel-picker">
          <span>Base color</span>
          <input type="color" value={base} onChange={event => setBase(event.target.value.toUpperCase())} />
          <code>{base}</code>
          <input className="wheel-hex field mono" value={base} maxLength={7} onChange={event => { const value = event.target.value.toUpperCase(); if (/^#[\da-f]{0,6}$/i.test(value)) setBase(value); }} onBlur={() => { if (!/^#[\da-f]{6}$/i.test(base)) setBase("#6366F1"); }} />
        </label>
      </div>

      <div className="harmony-panel">
        <label className="harmony-select">
          <span>Harmony scheme</span>
          <select className="select" value={harmony} onChange={event => setHarmony(event.target.value as Harmony)}>
            {HARMONIES.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="harmony-result">
          <div className="harmony-result-head"><div><span className="eyebrow">LIVE RESULT</span><h3>{harmony}</h3></div><span className="mono">{colors.length} colors</span></div>
          <div className="harmony-swatches">
            {colors.map((hex, index) => (
              <button key={`${hex}-${index}`} className="harmony-swatch" style={{ background: hex, color: textColor(hex), "--swatch-index": index } as React.CSSProperties} onClick={() => void copy(formatColor(hex, "HEX"), "HEX copied")} title="Copy HEX">
                <span className="swatch-index">{index + 1}</span><strong>{hex}</strong><small>{formatColor(hex, "RGB")}</small><Copy size={12} />
              </button>
            ))}
          </div>
          <div className="harmony-summary"><span><i style={{ background: base }} />Base <code>{base}</code></span><span><Check size={13} />Realtime HSL calculation</span></div>
        </div>
      </div>
    </div>

    <div className="wheel-templates">
      <div className="wheel-templates-heading">
        <div><span className="eyebrow">START FROM A TEMPLATE</span><h3>Harmony presets</h3><p>Choose a ready-made color relationship, then keep dragging to make it yours.</p></div>
        <span className="mono">{WHEEL_TEMPLATES.length} presets</span>
      </div>
      <div className="wheel-template-grid">
        {WHEEL_TEMPLATES.map((template, index) => {
          const templateHsl = hexToHsl(template.base);
          const templateColors = OFFSETS[template.harmony].map(offset => hslToHex(templateHsl.h + offset, templateHsl.s, templateHsl.l));
          return <button key={template.name} className="wheel-template-card" style={{ "--template-delay": `${index * 35}ms` } as React.CSSProperties} onClick={() => applyTemplate(template)}>
            <div className="wheel-template-swatches">{templateColors.slice(0, 4).map(color => <i key={color} style={{ background: color }} />)}</div>
            <div className="wheel-template-meta"><strong>{template.name}</strong><span>{template.harmony}</span><small>{template.tag}</small></div>
          </button>;
        })}
      </div>
    </div>
  </section>;
}
