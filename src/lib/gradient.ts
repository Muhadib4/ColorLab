import type { Gradient, GradientMode } from "../types";
import { hslToHex, normalizeHex, uid } from "./color";

export const GRADIENT_MODES: GradientMode[] = ["Smooth", "Vibrant", "Pastel", "Neon", "Dark", "Warm", "Cool"];
export const GRADIENT_POSITIONS = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function gradientCss(gradient: Gradient): string {
  const stops = gradient.stops.slice().sort((a, b) => a.position - b.position).map((stop) => `${normalizeHex(stop.color) ?? "#000000"} ${Math.round(clamp(stop.position, 0, 100) * 10) / 10}%`).join(", ");
  const angle = Math.round(clamp(gradient.angle, 0, 360));
  const position = (GRADIENT_POSITIONS as readonly string[]).includes(gradient.position) ? gradient.position : "center";
  if (gradient.type === "radial") return `radial-gradient(${gradient.shape === "circle" ? "circle" : "ellipse"} at ${position}, ${stops})`;
  if (gradient.type === "conic") return `conic-gradient(from ${angle}deg at ${position}, ${stops})`;
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function createGradient(colors: string[], angle = 135): Gradient {
  const valid = colors.map(normalizeHex).filter((color): color is string => color !== null).slice(0, 8);
  if (!valid.length) valid.push("#7C3AED", "#2563EB");
  if (valid.length === 1) valid.push(valid[0]);
  return { type: "linear", angle: clamp(angle, 0, 360), shape: "ellipse", position: "center", stops: valid.map((color, index) => ({ id: uid(), color, position: Math.round((index / (valid.length - 1)) * 100) })) };
}

export function generateGradient(mode: GradientMode): Gradient {
  const seed = Math.random() * 360;
  const count = Math.random() > 0.6 ? 4 : 3;
  const colors = Array.from({ length: count }, (_, index) => {
    const fraction = index / (count - 1);
    let h = seed + fraction * 85, s = 78, l = 46 + fraction * 23;
    if (mode === "Vibrant") { h = seed + fraction * 135; s = 94; l = 48 + fraction * 12; }
    if (mode === "Pastel") { h = seed + fraction * 115; s = 72; l = 79 + fraction * 6; }
    if (mode === "Neon") { h = seed + fraction * 165; s = 100; l = 48 + fraction * 10; }
    if (mode === "Dark") { s = 56; l = 9 + fraction * 24; }
    if (mode === "Warm") { h = -15 + Math.random() * 15 + fraction * 65; s = 91; l = 50 + fraction * 22; }
    if (mode === "Cool") { h = 255 - fraction * 90; s = 75; l = 42 + fraction * 25; }
    return hslToHex(h, s, l);
  });
  return createGradient(colors, [45, 90, 120, 135, 160][Math.floor(Math.random() * 5)]);
}
