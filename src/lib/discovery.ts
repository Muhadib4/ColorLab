import type { Palette } from "../types";
import { uid } from "./color";

type PaletteSeed = { name: string; tag: string; mood: string; theme: string; colors: string[] };

const seeds: PaletteSeed[] = [
  { name: "Aurora Atelier", tag: "Dreamy", mood: "Dreamy", theme: "Nature", colors: ["#172554", "#4338CA", "#7C3AED", "#2DD4BF", "#D9F99D"] },
  { name: "Citrus Signal", tag: "Vibrant", mood: "Energetic", theme: "Summer", colors: ["#14532D", "#65A30D", "#FACC15", "#FB923C", "#F43F5E"] },
  { name: "Quiet Architecture", tag: "Minimal", mood: "Calm", theme: "UI Design", colors: ["#17212B", "#334155", "#94A3B8", "#E2E8F0", "#F8FAFC"] },
  { name: "Sakura After Rain", tag: "Soft", mood: "Romantic", theme: "Sakura", colors: ["#831843", "#BE185D", "#F472B6", "#FBCFE8", "#FFF1F2"] },
  { name: "Deep Current", tag: "Dark", mood: "Serious", theme: "Ocean", colors: ["#082F49", "#0C4A6E", "#0369A1", "#38BDF8", "#CFFAFE"] },
  { name: "Velvet Cinema", tag: "Luxury", mood: "Mysterious", theme: "Luxury", colors: ["#18181B", "#3B0764", "#701A75", "#BE185D", "#F9A8D4"] },
  { name: "Mosslight", tag: "Earthy", mood: "Cozy", theme: "Forest", colors: ["#1C1917", "#44403C", "#78716C", "#A8A29E", "#D6D3D1"] },
  { name: "Signal Bloom", tag: "Neon", mood: "Futuristic", theme: "Cyberpunk", colors: ["#0F172A", "#312E81", "#DB2777", "#22D3EE", "#A3E635"] },
  { name: "Morning Paper", tag: "Light", mood: "Happy", theme: "Minimal", colors: ["#7C2D12", "#EA580C", "#FDBA74", "#FEF3C7", "#FFFBEB"] },
  { name: "Retro Arcade", tag: "Retro", mood: "Nostalgic", theme: "Gaming", colors: ["#2E1065", "#6D28D9", "#C026D3", "#F472B6", "#FDE047"] },
  { name: "Cloud Study", tag: "Pastel", mood: "Calm", theme: "Sky", colors: ["#1E3A8A", "#60A5FA", "#BAE6FD", "#E0F2FE", "#F8FAFC"] },
  { name: "Autumn Table", tag: "Warm", mood: "Cozy", theme: "Autumn", colors: ["#431407", "#9A3412", "#C2410C", "#D97706", "#FDE68A"] },
  { name: "Midnight Product", tag: "Bold", mood: "Serious", theme: "Technology", colors: ["#020617", "#111827", "#1D4ED8", "#6366F1", "#A5B4FC"] },
  { name: "Mint Condition", tag: "Fresh", mood: "Happy", theme: "Nature", colors: ["#064E3B", "#047857", "#10B981", "#6EE7B7", "#ECFDF5"] },
  { name: "Rosewood", tag: "Vintage", mood: "Romantic", theme: "Wedding", colors: ["#450A0A", "#7F1D1D", "#B91C1C", "#DCA5A5", "#FEF2F2"] },
  { name: "Solaris", tag: "High Contrast", mood: "Energetic", theme: "Space", colors: ["#1E1B4B", "#4338CA", "#F59E0B", "#FDE047", "#FFF7ED"] },
];

const shifts = [
  ["#0F172A", "#334155", "#64748B", "#CBD5E1", "#F8FAFC"],
  ["#172554", "#1D4ED8", "#38BDF8", "#67E8F9", "#ECFEFF"],
  ["#3B0764", "#7E22CE", "#C026D3", "#F0ABFC", "#FDF4FF"],
  ["#431407", "#C2410C", "#FB923C", "#FED7AA", "#FFF7ED"],
  ["#052E16", "#15803D", "#4ADE80", "#BBF7D0", "#F0FDF4"],
  ["#4A044E", "#BE185D", "#F43F5E", "#FDA4AF", "#FFF1F2"],
  ["#422006", "#A16207", "#FACC15", "#FEF08A", "#FEFCE8"],
  ["#083344", "#0E7490", "#22D3EE", "#A5F3FC", "#ECFEFF"],
  ["#1C1917", "#57534E", "#A8A29E", "#D6CCC2", "#FAFAF9"],
  ["#172554", "#4F46E5", "#8B5CF6", "#C4B5FD", "#F5F3FF"],
];

export const DISCOVERY_PALETTES: PaletteSeed[] = Array.from({ length: 160 }, (_, index) => {
  const base = seeds[index % seeds.length];
  const variant = shifts[index % shifts.length];
  return index < seeds.length ? base : {
    ...base,
    name: `${base.name} ${String(Math.floor(index / seeds.length) + 2).padStart(2, "0")}`,
    colors: variant,
    tag: index % 3 === 0 ? "Curated" : base.tag,
  };
});

export function paletteFromSeed(seed: PaletteSeed): Palette {
  return { mode: "Random", colors: seed.colors.map(hex => ({ id: uid(), hex, locked: false })) };
}

export const DISCOVERY_CATEGORIES = ["All", "Pastel", "Vibrant", "Muted", "Neon", "Dark", "Light", "Vintage", "Minimal", "Luxury", "Soft", "Bold", "Earthy", "Retro", "Nature", "Ocean", "Cyberpunk", "Sakura", "Technology", "Gaming"];
export type DiscoveryPalette = PaletteSeed;
