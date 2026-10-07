"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { formatColor, hexToHsl, hslToHex, textColor, uid } from "@/lib/color";
import type { CopyValue, Notify, Palette } from "@/types";

type Harmony = "Monochromatic" | "Analogous" | "Complementary" | "Split-Complementary" | "Triadic" | "Tetradic" | "Square" | "Diadic" | "Double Complementary" | "Accented Analogous" | "Shades" | "Tints" | "Tones" | "Warm" | "Cool";
const HARMONIES: Harmony[] = ["Monochromatic", "Analogous", "Complementary", "Split-Complementary", "Triadic", "Tetradic", "Square", "Diadic", "Double Complementary", "Accented Analogous", "Shades", "Tints", "Tones", "Warm", "Cool"];
const OFFSETS: Record<Harmony, number[]> = {
  Monochromatic: [0, 0, 0, 0], Analogous: [-30, -15, 0, 15], Complementary: [0, 180], "Split-Complementary": [0, 150, 210], Triadic: [0, 120, 240], Tetradic: [0, 60, 180, 240], Square: [0, 90, 180, 270], Diadic: [0, 60], "Double Complementary": [0, 30, 180, 210], "Accented Analogous": [0, 30, 60, 180], Shades: [0, 0, 0, 0], Tints: [0, 0, 0, 0], Tones: [0, 0, 0, 0], Warm: [-18, 0, 18, 36], Cool: [165, 195, 225, 255],
};

interface Props { onUsePalette: (palette: Palette) => void; copy: CopyValue; notify: Notify }

export default function ColorWheel({ onUsePalette, copy, notify }: Props) {
  const [base, setBase] = useState("#6366F1");
  const [harmony, setHarmony] = useState<Harmony>("Complementary");
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
  const setBaseFromWheel = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2; const y = event.clientY - rect.top - rect.height / 2;
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    setBase(hslToHex(angle, hsl.s || 70, hsl.l || 55));
  };
  const useAsPalette = () => { onUsePalette({ mode: harmony === "Split-Complementary" ? "Split Complementary" : harmony === "Accented Analogous" ? "Analogous" : harmony === "Double Complementary" ? "Tetradic" : harmony as Palette["mode"], colors: colors.slice(0, 4).map(hex => ({ id: uid(), hex, locked: false })) }); notify("Harmony added to your palette"); };
  return <section className="wheel-workspace">
    <div className="wheel-intro"><div><span className="eyebrow">COLOR WHEEL · HARMONY LAB</span><h2>Find the relationship between colors.</h2><p>Choose a base color, then explore deterministic harmony schemes based on HSL color theory.</p></div><button className="button button-primary" onClick={useAsPalette}><Send size={15} />Use as Palette</button></div>
    <div className="wheel-layout"><div className="wheel-panel"><div className="color-wheel" onClick={setBaseFromWheel} role="slider" tabIndex={0} aria-label="Interactive color wheel" aria-valuemin={0} aria-valuemax={359} aria-valuenow={hsl.h} style={{ "--wheel-angle": `${hsl.h}deg` } as React.CSSProperties}><span className="wheel-core" style={{ background: base, color: textColor(base) }}>{base}</span><span className="wheel-pointer" style={{ transform: `rotate(${hsl.h}deg) translateX(101px)` }} /></div><label className="wheel-picker"><span>Base color</span><input type="color" value={base} onChange={event => setBase(event.target.value.toUpperCase())} /><code>{base}</code><input className="wheel-hex field mono" value={base} maxLength={7} onChange={event => { const value = event.target.value.toUpperCase(); if (/^#[\da-f]{0,6}$/i.test(value)) setBase(value); }} onBlur={() => { if (!/^#[\da-f]{6}$/i.test(base)) setBase("#6366F1"); }} /></label></div>
      <div className="harmony-panel"><label className="harmony-select"><span>Harmony scheme</span><select className="select" value={harmony} onChange={event => setHarmony(event.target.value as Harmony)}>{HARMONIES.map(item => <option key={item}>{item}</option>)}</select></label><div className="harmony-result"><div className="harmony-result-head"><div><span className="eyebrow">LIVE RESULT</span><h3>{harmony}</h3></div><span className="mono">{colors.length} colors</span></div><div className="harmony-swatches">{colors.map(hex => <button key={hex} className="harmony-swatch" style={{ background: hex, color: textColor(hex) }} onClick={() => void copy(formatColor(hex, "HEX"), "HEX copied")} title="Copy HEX"><strong>{hex}</strong><small>{formatColor(hex, "RGB")}</small><Copy size={12} /></button>)}</div><div className="harmony-summary"><span><i style={{ background: base }} />Base <code>{base}</code></span><span><Check size={13} />Realtime HSL calculation</span></div></div></div></div>
  </section>;
}
