import type { Color, Creation, Gradient, GradientStop, Palette, PaletteMode } from "../types";
import { MAX_PALETTE_COLORS, normalizeHex, PALETTE_MODES, textColor, uid } from "./color";
import { gradientCss, GRADIENT_POSITIONS } from "./gradient";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isFiniteInRange = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const validId = (value: unknown): value is string => typeof value === "string" && /^[\w-]{1,100}$/.test(value);

/** Treat persisted and shared designs as untrusted data before they reach the editors. */
export function validateCreation(value: unknown): Creation | null {
  if (!isRecord(value)) return null;
  const ids = new Set<string>();
  const getId = (candidate: unknown) => {
    const id = validId(candidate) && !ids.has(candidate) ? candidate : uid();
    ids.add(id);
    return id;
  };
  if (value.kind === "palette" && isRecord(value.palette)) {
    const palette = value.palette;
    if (!Array.isArray(palette.colors) || palette.colors.length < 2 || palette.colors.length > MAX_PALETTE_COLORS || typeof palette.mode !== "string" || !PALETTE_MODES.includes(palette.mode as PaletteMode)) return null;
    const colors: Color[] = [];
    for (const entry of palette.colors) {
      if (!isRecord(entry) || typeof entry.hex !== "string" || typeof entry.locked !== "boolean") return null;
      const hex = normalizeHex(entry.hex);
      if (!hex) return null;
      colors.push({ id: getId(entry.id), hex, locked: entry.locked });
    }
    return { kind: "palette", palette: { mode: palette.mode as PaletteMode, colors } };
  }
  if (value.kind === "gradient" && isRecord(value.gradient)) {
    const gradient = value.gradient;
    if (gradient.type !== "linear" && gradient.type !== "radial" && gradient.type !== "conic") return null;
    if (gradient.shape !== "circle" && gradient.shape !== "ellipse") return null;
    if (!isFiniteInRange(gradient.angle, 0, 360) || typeof gradient.position !== "string" || !(GRADIENT_POSITIONS as readonly string[]).includes(gradient.position)) return null;
    if (!Array.isArray(gradient.stops) || gradient.stops.length < 2 || gradient.stops.length > 8) return null;
    const stops: GradientStop[] = [];
    for (const entry of gradient.stops) {
      if (!isRecord(entry) || typeof entry.color !== "string" || !isFiniteInRange(entry.position, 0, 100)) return null;
      const color = normalizeHex(entry.color);
      if (!color) return null;
      stops.push({ id: getId(entry.id), color, position: entry.position });
    }
    return { kind: "gradient", gradient: { type: gradient.type, angle: gradient.angle, shape: gradient.shape, position: gradient.position, stops } };
  }
  return null;
}

export function serializeCreation(creation: Creation): string {
  const params = new URLSearchParams();
  if (creation.kind === "palette") {
    params.set("colors", creation.palette.colors.map((color) => color.hex.replace(/^#/, "")).join(","));
    params.set("mode", creation.palette.mode);
    const locked = creation.palette.colors.flatMap((color, index) => color.locked ? [index] : []);
    if (locked.length) params.set("locks", locked.join(","));
  } else {
    const { type, angle, shape, position, stops } = creation.gradient;
    params.set("gradient", type);
    params.set("angle", String(angle));
    params.set("shape", shape);
    params.set("position", position);
    params.set("stops", stops.map((stop) => `${stop.color.replace(/^#/, "")}:${stop.position}`).join(","));
  }
  return params.toString();
}

export function parseSharedCreation(search: string): Creation | null {
  if (!search || search.length > 8000) return null;
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    if (params.has("colors") && params.has("gradient")) return null;
    if (params.has("colors")) {
      const parts = (params.get("colors") ?? "").split(",");
      const locksText = params.get("locks");
      const locks = locksText ? locksText.split(",") : [];
      if (locks.some((index) => !/^\d+$/.test(index) || Number(index) >= parts.length)) return null;
      return validateCreation({ kind: "palette", palette: { mode: params.get("mode") ?? "Random", colors: parts.map((hex, index) => ({ id: uid(), hex, locked: locks.includes(String(index)) })) } });
    }
    if (params.has("gradient")) {
      const angleText = params.get("angle") ?? "135";
      if (!/^\d+(?:\.\d+)?$/.test(angleText)) return null;
      const parts = (params.get("stops") ?? "").split(",");
      const stops: GradientStop[] = [];
      for (const part of parts) {
        const [color, positionText, extra] = part.split(":");
        if (extra !== undefined || !positionText || !/^\d+(?:\.\d+)?$/.test(positionText)) return null;
        stops.push({ id: uid(), color, position: Number(positionText) });
      }
      return validateCreation({ kind: "gradient", gradient: { type: params.get("gradient"), angle: Number(angleText), shape: params.get("shape") ?? "ellipse", position: params.get("position") ?? "center", stops } });
    }
  } catch {
    return null;
  }
  return null;
}

export function exportPalette(palette: Palette, format: "css" | "json" | "tailwind" | "hex" | "svg"): string {
  const colors = palette.colors.map((color) => normalizeHex(color.hex) ?? "#000000");
  if (format === "hex") return colors.join("\n");
  if (format === "json") return JSON.stringify({ name: "ColorLab palette", mode: palette.mode, colors }, null, 2);
  if (format === "tailwind") return `export default {\n  theme: {\n    extend: {\n      colors: {\n${colors.map((color, index) => `        'color-${index + 1}': '${color}',`).join("\n")}\n      },\n    },\n  },\n};`;
  if (format === "svg") {
    const width = Math.max(1, colors.length) * 160;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="200" viewBox="0 0 ${width} 200" role="img" aria-label="ColorLab palette">\n${colors.map((color, index) => `  <rect x="${index * 160}" width="160" height="200" fill="${color}"/>\n  <text x="${index * 160 + 80}" y="173" text-anchor="middle" font-family="monospace" font-size="16" fill="${textColor(color)}">${color}</text>`).join("\n")}\n</svg>`;
  }
  return `:root {\n${colors.map((color, index) => `  --color-${index + 1}: ${color};`).join("\n")}\n}`;
}

export function exportGradient(gradient: Gradient, format: "css" | "json" | "tailwind" | "value"): string {
  const value = gradientCss(gradient);
  if (format === "json") {
    const { type, angle, shape, position, stops } = gradient;
    return JSON.stringify({ type, angle, shape, position, stops: stops.map(({ color, position: stopPosition }) => ({ color, position: stopPosition })), css: value }, null, 2);
  }
  if (format === "tailwind") return `bg-[${value.replaceAll(" ", "_")}]`;
  if (format === "value") return value;
  return `background: ${value};`;
}
