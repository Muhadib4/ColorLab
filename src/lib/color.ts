import type { Color, ColorFormat, PaletteMode } from "../types";

export const PALETTE_MODES: PaletteMode[] = ["Random", "Monochromatic", "Analogous", "Complementary", "Split Complementary", "Triadic", "Tetradic", "Warm", "Cool", "Pastel", "Vibrant", "Muted", "Dark", "Light"];
export const MIN_PALETTE_COLORS = 3;
export const MAX_PALETTE_COLORS = 24;
export const PALETTE_COLOR_OPTIONS = [3, 4, 5, 6, 8, 10, 12, 16] as const;

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `color-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(raw)) return `#${raw.split("").map((part) => part + part).join("").toUpperCase()}`;
  return /^[\da-f]{6}$/i.test(raw) ? `#${raw.toUpperCase()}` : null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const hue = (value: number) => Number.isFinite(value) ? ((value % 360) + 360) % 360 : 0;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = Number.parseInt((normalizeHex(hex) ?? "#000000").slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function channels(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const values = [r / 255, g / 255, b / 255];
  const max = Math.max(...values), min = Math.min(...values), delta = max - min;
  let h = 0;
  if (delta) {
    if (max === values[0]) h = ((values[1] - values[2]) / delta) % 6;
    else if (max === values[1]) h = (values[2] - values[0]) / delta + 2;
    else h = (values[0] - values[1]) / delta + 4;
  }
  return { h: hue(h * 60), max, min, delta };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { h, max, min, delta } = channels(hex);
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { h, max, delta } = channels(hex);
  return { h: Math.round(h) % 360, s: Math.round(max === 0 ? 0 : (delta / max) * 100), v: Math.round(max * 100) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function hslToHex(h: number, s: number, l: number): string {
  h = hue(h); s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function formatColor(hex: string, format: ColorFormat): string {
  if (format === "RGB") {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (format === "HSL") {
    const { h, s, l } = hexToHsl(hex);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return normalizeHex(hex) ?? "#000000";
}

const NAMED_COLORS: [string, string][] = [
  ["Obsidian", "#121218"], ["Charcoal", "#35363A"], ["Slate", "#64748B"], ["Silver", "#B9BFC9"], ["Cloud", "#E2E8F0"], ["Snow", "#FAFAFF"],
  ["Midnight Blue", "#1E254D"], ["Navy", "#193A71"], ["Royal Blue", "#2563EB"], ["Periwinkle", "#7F93ED"], ["Sky Blue", "#61BEF5"], ["Arctic Blue", "#BAE6FD"],
  ["Indigo", "#5145CD"], ["Electric Violet", "#7C3AED"], ["Amethyst", "#A855F7"], ["Soft Lavender", "#C4B5FD"], ["Lilac", "#DDD0FA"], ["Plum", "#702963"],
  ["Orchid", "#D96DC0"], ["Rose Pink", "#F28CB6"], ["Blush", "#FBC8D5"], ["Magenta", "#E82E97"], ["Raspberry", "#BE185D"], ["Burgundy", "#771E3C"],
  ["Coral", "#F87977"], ["Scarlet", "#E83B46"], ["Terracotta", "#BE654D"], ["Burnt Orange", "#CF692D"], ["Tangerine", "#FB923C"], ["Peach", "#FFCBA8"],
  ["Amber", "#F5B833"], ["Gold", "#D4A637"], ["Butter", "#F7E8A0"], ["Ivory", "#FFF4D6"], ["Sand", "#D8C4A3"], ["Cocoa", "#755841"],
  ["Lime", "#BEF264"], ["Chartreuse", "#A3C628"], ["Olive", "#778342"], ["Sage", "#A3B89B"], ["Forest", "#285943"], ["Emerald", "#10B981"],
  ["Mint", "#8EE6BC"], ["Seafoam", "#B3EBDC"], ["Teal", "#209C9A"], ["Deep Teal", "#155E63"], ["Turquoise", "#2DD4BF"], ["Cyan", "#06B6D4"],
];

export function colorName(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  let closest = "Obsidian", distance = Infinity;
  for (const [name, sample] of NAMED_COLORS) {
    const color = hexToRgb(sample), meanRed = (r + color.r) / 2;
    const next = (2 + meanRed / 256) * (r - color.r) ** 2 + 4 * (g - color.g) ** 2 + (2 + (255 - meanRed) / 256) * (b - color.b) ** 2;
    if (next < distance) { distance = next; closest = name; }
  }
  return closest;
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linear = [r, g, b].map((value) => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(a: string, b: string): number {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function textColor(hex: string): string {
  return contrastRatio(hex, "#FFFFFF") >= contrastRatio(hex, "#000000") ? "#FFFFFF" : "#000000";
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

export function generatePalette(count: number, mode: PaletteMode, existing: Color[] = [], seedHexes: string[] = []): Color[] {
  count = Math.round(clamp(count, MIN_PALETTE_COLORS, MAX_PALETTE_COLORS));

  const seeds = [...new Set(seedHexes
    .map(normalizeHex)
    .filter((hex): hex is string => Boolean(hex)))]
    .slice(0, 4);

  const locked = existing.filter(color => color.locked).map(color => normalizeHex(color.hex)).filter((hex): hex is string => Boolean(hex));

  // No seeds: keep the original free-form generator behavior.
  if (!seeds.length) {
    const anchor = existing.find(color => color.locked);
    const base = anchor ? hexToHsl(anchor.hex).h : random(0, 360);
    const saturation = anchor ? hexToHsl(anchor.hex).s : random(55, 80);

    return Array.from({ length: count }, (_, index) => {
      if (existing[index]?.locked) return { ...existing[index] };

      const fraction = index / Math.max(1, count - 1);
      let h = base, s = saturation, l = 44 + fraction * 23;

      switch (mode) {
        case "Monochromatic": l = 24 + fraction * 62; s = saturation - fraction * 14; break;
        case "Analogous": h = base - 38 + fraction * 76; l = 42 + fraction * 30; break;
        case "Complementary": h = base + (index % 2) * 180; l = 39 + fraction * 35; break;
        case "Split Complementary": h = base + [0, 150, 210][index % 3]; l = 42 + fraction * 30; break;
        case "Triadic": h = base + (index % 3) * 120; l = 42 + fraction * 30; break;
        case "Tetradic": h = base + (index % 4) * 90; l = 42 + fraction * 30; break;
        case "Warm": h = random(-20, 55); s = random(68, 94); l = 42 + fraction * 33; break;
        case "Cool": h = random(165, 260); s = random(48, 85); l = 35 + fraction * 38; break;
        case "Pastel": h = base + fraction * 150; s = random(48, 79); l = random(77, 87); break;
        case "Vibrant": h = base + fraction * 210; s = random(80, 98); l = random(49, 64); break;
        case "Muted": h = base + fraction * 140; s = random(16, 32); l = 38 + fraction * 38; break;
        case "Dark": h = base + fraction * 105; s = random(28, 60); l = 11 + fraction * 22; break;
        case "Light": h = base + fraction * 145; s = random(38, 70); l = random(85, 94); break;
        default: h = base + fraction * random(160, 300); s = random(42, 88); l = 37 + fraction * 41;
      }

      return { id: uid(), hex: hslToHex(h, s, l), locked: false };
    });
  }

  // Seeds are anchors for the entire palette, not colors that only occupy the first slots.
  const seedHsl = seeds.map(hexToHsl);
  const averageHue = (() => {
    const x = seedHsl.reduce((sum, c) => sum + Math.cos(c.h * Math.PI / 180), 0);
    const y = seedHsl.reduce((sum, c) => sum + Math.sin(c.h * Math.PI / 180), 0);
    return hue(Math.atan2(y, x) * 180 / Math.PI);
  })();
  const averageSaturation = seedHsl.reduce((sum, c) => sum + c.s, 0) / seedHsl.length;
  const averageLightness = seedHsl.reduce((sum, c) => sum + c.l, 0) / seedHsl.length;

  const nearestSeed = (index: number) => seedHsl[index % seedHsl.length];
  const generated = Array.from({ length: count }, (_, index) => {
    if (existing[index]?.locked) return { ...existing[index] };

    // Spread seed colors through the palette rather than placing them only at the beginning.
    if (index < seeds.length) {
      const seed = seeds[index];
      return { id: uid(), hex: seed, locked: false };
    }

    const fraction = index / Math.max(1, count - 1);
    const source = nearestSeed(index);
    let h = source.h;
    let s = source.s;
    let l = source.l;

    switch (mode) {
      case "Monochromatic":
        h = averageHue;
        s = clamp(averageSaturation + (source.s - averageSaturation) * 0.35, 18, 96);
        l = clamp(18 + fraction * 68, 12, 94);
        break;
      case "Analogous":
        h = averageHue + (fraction - 0.5) * 76 + (source.h - averageHue) * 0.35;
        s = clamp(averageSaturation + (source.s - averageSaturation) * 0.45, 25, 96);
        l = clamp(30 + fraction * 48, 14, 92);
        break;
      case "Complementary":
        h = source.h + (index % 2 ? 180 : 0);
        s = clamp(source.s, 30, 96);
        l = clamp(30 + fraction * 48, 14, 92);
        break;
      case "Split Complementary":
        h = source.h + [0, 150, 210][index % 3];
        s = clamp(source.s, 30, 96);
        l = clamp(32 + fraction * 45, 15, 92);
        break;
      case "Triadic":
        h = source.h + (index % 3) * 120;
        s = clamp(source.s, 32, 96);
        l = clamp(32 + fraction * 45, 15, 92);
        break;
      case "Tetradic":
        h = source.h + (index % 4) * 90;
        s = clamp(source.s, 30, 96);
        l = clamp(32 + fraction * 45, 15, 92);
        break;
      case "Warm":
        h = source.h * 0.7 + 35 * 0.3;
        s = clamp(Math.max(source.s, 62), 55, 96);
        l = clamp(30 + fraction * 48, 16, 90);
        break;
      case "Cool":
        h = source.h * 0.7 + 210 * 0.3;
        s = clamp(Math.max(source.s, 48), 40, 90);
        l = clamp(30 + fraction * 48, 16, 90);
        break;
      case "Pastel":
        h = source.h + (fraction - 0.5) * 36;
        s = clamp(source.s * 0.62, 28, 72);
        l = clamp(76 + ((source.l - averageLightness) * 0.08), 72, 92);
        break;
      case "Vibrant":
        h = source.h + (fraction - 0.5) * 48;
        s = clamp(Math.max(source.s, 78), 72, 100);
        l = clamp(46 + (source.l - averageLightness) * 0.18, 38, 68);
        break;
      case "Muted":
        h = source.h + (fraction - 0.5) * 42;
        s = clamp(Math.min(source.s, 38), 14, 42);
        l = clamp(source.l + (50 - source.l) * 0.18, 28, 76);
        break;
      case "Dark":
        h = source.h + (fraction - 0.5) * 36;
        s = clamp(source.s * 0.82, 22, 78);
        l = clamp(12 + fraction * 25, 8, 38);
        break;
      case "Light":
        h = source.h + (fraction - 0.5) * 44;
        s = clamp(source.s * 0.78, 25, 78);
        l = clamp(84 + (source.l - averageLightness) * 0.08, 78, 96);
        break;
      default:
        h = source.h + (fraction - 0.5) * 90;
        s = clamp(source.s, 28, 94);
        l = clamp(source.l + (50 - source.l) * 0.25 + (fraction - 0.5) * 20, 14, 92);
    }

    return { id: uid(), hex: hslToHex(h, s, l), locked: false };
  });

  // Keep selected seeds represented even when the palette has fewer slots than seeds.
  // Count is always at least 3, and seeds are capped at 4.
  return generated.map((color, index) => {
    const lockedHex = locked[index];
    return lockedHex && !seeds.includes(color.hex) ? { ...color, hex: lockedHex, locked: true } : color;
  });
}
export function colorScale(hex: string, kind: "shades" | "tints" | "tones"): { label: string; hex: string }[] {
  const labels = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  const rgb = hexToRgb(hex);
  const target = kind === "shades" ? 0 : kind === "tints" ? 255 : 128;
  return labels.map((label, index) => {
    const mix = (index / (labels.length - 1)) * (kind === "shades" ? 0.9 : kind === "tints" ? 0.94 : 0.9);
    return { label, hex: rgbToHex(rgb.r + (target - rgb.r) * mix, rgb.g + (target - rgb.g) * mix, rgb.b + (target - rgb.b) * mix) };
  });
}
