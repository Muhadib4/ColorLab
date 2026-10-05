import type { Color, Palette } from "../types";
import { MAX_PALETTE_COLORS, MIN_PALETTE_COLORS, hexToRgb, normalizeHex, uid } from "./color";

export type LibraryType = "Palette" | "Aesthetic" | "Effect";

export interface DesignLibraryItem {
  id: string;
  name: string;
  type: LibraryType;
  group: string;
  category: string;
  description: string;
  colors: string[];
  tags: string[];
}

const clampCount = (count: number) => Math.min(MAX_PALETTE_COLORS, Math.max(MIN_PALETTE_COLORS, Number.isFinite(count) ? Math.round(count) : MIN_PALETTE_COLORS));
const id = (type: LibraryType, group: string, name: string) => `${type}-${group}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const COLOR_SEEDS: Record<string, string[]> = {
  monochromatic: ["#111827", "#374151", "#6B7280", "#D1D5DB", "#F9FAFB"],
  complementary: ["#1D4ED8", "#38BDF8", "#F97316", "#FDBA74"],
  analogous: ["#2563EB", "#06B6D4", "#10B981", "#A7F3D0"],
  triadic: ["#7C3AED", "#F97316", "#22C55E", "#FDE68A"],
  tetradic: ["#1D4ED8", "#7C3AED", "#F97316", "#22C55E"],
  "split complementary": ["#2563EB", "#22D3EE", "#F97316", "#EC4899"],
  "double complementary": ["#0F766E", "#14B8A6", "#7C2D12", "#FB923C", "#581C87"],
  square: ["#2563EB", "#9333EA", "#EA580C", "#16A34A"],
  rectangle: ["#1E40AF", "#7C3AED", "#D97706", "#059669"],
  "accented analogous": ["#0891B2", "#06B6D4", "#10B981", "#A3E635", "#F97316"],
  black: ["#030712", "#111827", "#1F2937", "#6B7280", "#F9FAFB"],
  white: ["#FFFFFF", "#F8FAFC", "#E5E7EB", "#9CA3AF", "#111827"],
  grayscale: ["#111827", "#374151", "#6B7280", "#D1D5DB", "#F9FAFB"],
  silver: ["#334155", "#64748B", "#CBD5E1", "#E5E7EB", "#FFFFFF"],
  slate: ["#0F172A", "#334155", "#64748B", "#CBD5E1", "#F8FAFC"],
  charcoal: ["#0A0A0A", "#18181B", "#3F3F46", "#A1A1AA", "#F4F4F5"],
  navy: ["#020617", "#172554", "#1D4ED8", "#60A5FA", "#DBEAFE"],
  cobalt: ["#172554", "#1D4ED8", "#2563EB", "#93C5FD", "#EFF6FF"],
  azure: ["#082F49", "#0369A1", "#0EA5E9", "#7DD3FC", "#F0F9FF"],
  cyan: ["#083344", "#0E7490", "#06B6D4", "#67E8F9", "#ECFEFF"],
  teal: ["#042F2E", "#0F766E", "#14B8A6", "#5EEAD4", "#F0FDFA"],
  emerald: ["#052E16", "#047857", "#10B981", "#6EE7B7", "#ECFDF5"],
  forest: ["#052E16", "#14532D", "#166534", "#4ADE80", "#DCFCE7"],
  lime: ["#1A2E05", "#4D7C0F", "#84CC16", "#BEF264", "#F7FEE7"],
  olive: ["#1C1917", "#4D4D1F", "#6B7A2F", "#A3A635", "#FEFCE8"],
  yellow: ["#422006", "#CA8A04", "#FACC15", "#FEF08A", "#FEFCE8"],
  gold: ["#451A03", "#A16207", "#D4A72C", "#FDE68A", "#FFFBEB"],
  amber: ["#451A03", "#B45309", "#F59E0B", "#FCD34D", "#FFFBEB"],
  orange: ["#431407", "#C2410C", "#F97316", "#FDBA74", "#FFF7ED"],
  coral: ["#450A0A", "#BE123C", "#F87171", "#FDA4AF", "#FFF1F2"],
  red: ["#450A0A", "#991B1B", "#EF4444", "#FCA5A5", "#FEF2F2"],
  crimson: ["#4C0519", "#9F1239", "#E11D48", "#FDA4AF", "#FFF1F2"],
  rose: ["#4C0519", "#BE123C", "#F43F5E", "#FDA4AF", "#FFF1F2"],
  pink: ["#500724", "#BE185D", "#EC4899", "#F9A8D4", "#FDF2F8"],
  magenta: ["#4A044E", "#A21CAF", "#D946EF", "#F0ABFC", "#FDF4FF"],
  purple: ["#2E1065", "#6D28D9", "#9333EA", "#C084FC", "#F5F3FF"],
  violet: ["#2E1065", "#7C3AED", "#8B5CF6", "#C4B5FD", "#F5F3FF"],
  indigo: ["#1E1B4B", "#4338CA", "#4F46E5", "#A5B4FC", "#EEF2FF"],
  pastel: ["#C7D2FE", "#BAE6FD", "#BBF7D0", "#FBCFE8", "#FEF3C7"],
  vibrant: ["#7C3AED", "#EC4899", "#F97316", "#FACC15", "#22C55E"],
  muted: ["#57534E", "#78716C", "#A8A29E", "#D6CCC2", "#F5EBE0"],
  soft: ["#DDD6FE", "#FBCFE8", "#FED7AA", "#DCFCE7", "#E0F2FE"],
  neon: ["#020617", "#22D3EE", "#A3E635", "#F0ABFC", "#FB7185"],
  dark: ["#020617", "#111827", "#312E81", "#581C87", "#9F1239"],
  light: ["#F8FAFC", "#E0F2FE", "#F5F3FF", "#FFF1F2", "#FFFBEB"],
  earthy: ["#1C1917", "#57534E", "#78716C", "#A16207", "#D6CCC2"],
  warm: ["#7F1D1D", "#C2410C", "#F97316", "#FACC15", "#FEF3C7"],
  cool: ["#0F172A", "#1D4ED8", "#06B6D4", "#14B8A6", "#ECFEFF"],
  neutral: ["#1C1917", "#44403C", "#78716C", "#D6D3D1", "#FAFAF9"],
  elegant: ["#111827", "#4B5563", "#C4B5FD", "#F9A8D4", "#F9FAFB"],
  luxury: ["#030712", "#18181B", "#B45309", "#FDE68A", "#FFF7ED"],
  playful: ["#F472B6", "#FB923C", "#FDE047", "#86EFAC", "#93C5FD"],
  calm: ["#164E63", "#0891B2", "#A5F3FC", "#CCFBF1", "#F0FDFA"],
  energetic: ["#BE123C", "#F97316", "#FACC15", "#84CC16", "#06B6D4"],
  romantic: ["#831843", "#BE185D", "#F472B6", "#FBCFE8", "#FFF1F2"],
  mysterious: ["#020617", "#1E1B4B", "#581C87", "#9D174D", "#F0ABFC"],
  futuristic: ["#020617", "#172554", "#2563EB", "#22D3EE", "#A3E635"],
  professional: ["#0F172A", "#1E293B", "#2563EB", "#94A3B8", "#F8FAFC"],
  ocean: ["#082F49", "#075985", "#0284C7", "#0EA5E9", "#BAE6FD"],
  sky: ["#1E3A8A", "#2563EB", "#60A5FA", "#BAE6FD", "#F0F9FF"],
  moss: ["#1C1917", "#365314", "#4D7C0F", "#A3E635", "#ECFCCB"],
  desert: ["#451A03", "#92400E", "#D97706", "#FDBA74", "#FEF3C7"],
  sand: ["#78350F", "#C19A6B", "#D6C2A3", "#FDE68A", "#FFFBEB"],
  earth: ["#292524", "#57534E", "#8B5E3C", "#A8A29E", "#F5F5F4"],
  autumn: ["#431407", "#9A3412", "#C2410C", "#D97706", "#FDE68A"],
  spring: ["#14532D", "#22C55E", "#86EFAC", "#F9A8D4", "#FEF3C7"],
  summer: ["#164E63", "#0EA5E9", "#22C55E", "#FACC15", "#FB923C"],
  winter: ["#0F172A", "#1E3A8A", "#BAE6FD", "#E0F2FE", "#FFFFFF"],
  sunset: ["#581C87", "#BE185D", "#F97316", "#FDE68A", "#FFF7ED"],
  sunrise: ["#7C2D12", "#EA580C", "#FDBA74", "#FBCFE8", "#F0F9FF"],
  aurora: ["#172554", "#4338CA", "#7C3AED", "#2DD4BF", "#D9F99D"],
  tropical: ["#064E3B", "#10B981", "#2DD4BF", "#FACC15", "#FB7185"],
  arctic: ["#155E75", "#22D3EE", "#CCFBF1", "#F8FAFC", "#FFFFFF"],
  cyberpunk: ["#020617", "#06B6D4", "#7C3AED", "#DB2777", "#F0ABFC"],
  synthwave: ["#1E1B4B", "#312E81", "#7C3AED", "#F472B6", "#FDE047"],
  vaporwave: ["#312E81", "#8B5CF6", "#F0ABFC", "#67E8F9", "#F9A8D4"],
  y2k: ["#E0F2FE", "#A5B4FC", "#F0ABFC", "#F9A8D4", "#FFFFFF"],
  cybercore: ["#020617", "#00E5FF", "#2563EB", "#A3E635", "#E879F9"],
  academia: ["#1C1917", "#44403C", "#7C2D12", "#D6CCC2", "#F5F5DC"],
  gothic: ["#020617", "#18181B", "#7F1D1D", "#581C87", "#A1A1AA"],
  cottagecore: ["#365314", "#A3B18A", "#F2D0A4", "#FBCFE8", "#FFF7ED"],
  fairycore: ["#6D28D9", "#C084FC", "#F9A8D4", "#BBF7D0", "#FEF3C7"],
  dreamcore: ["#C7D2FE", "#F0ABFC", "#FBCFE8", "#BAE6FD", "#FFF7ED"],
  weirdcore: ["#1E1B4B", "#84CC16", "#D946EF", "#F97316", "#F8FAFC"],
  "frutiger aero": ["#0369A1", "#0EA5E9", "#22C55E", "#A7F3D0", "#F0F9FF"],
  retro: ["#422006", "#BE123C", "#F97316", "#FACC15", "#0E7490"],
  vintage: ["#451A03", "#7C2D12", "#A16207", "#D6CCC2", "#FAF3DD"],
  minimalist: ["#111827", "#6B7280", "#E5E7EB", "#F9FAFB", "#A3E635"],
  maximalist: ["#7C3AED", "#E11D48", "#F97316", "#FACC15", "#14B8A6"],
  glass: ["#0F172A", "#38BDF8", "#C7D2FE", "#E0F2FE", "#FFFFFF"],
  metallic: ["#111827", "#475569", "#94A3B8", "#E5E7EB", "#FDE68A"],
  chrome: ["#020617", "#334155", "#94A3B8", "#F8FAFC", "#22D3EE"],
  holographic: ["#67E8F9", "#C4B5FD", "#F0ABFC", "#FDE68A", "#FFFFFF"],
  iridescent: ["#CCFBF1", "#BAE6FD", "#DDD6FE", "#FBCFE8", "#FEF3C7"],
  matrix: ["#020617", "#052E16", "#16A34A", "#86EFAC", "#DCFCE7"],
  terminal: ["#020617", "#111827", "#22C55E", "#86EFAC", "#F8FAFC"],
  crt: ["#020617", "#1E1B4B", "#EF4444", "#22C55E", "#3B82F6"],
  candy: ["#F472B6", "#F9A8D4", "#FDE68A", "#A7F3D0", "#BAE6FD"],
  royal: ["#1E1B4B", "#4C1D95", "#7C3AED", "#D4A72C", "#FEF3C7"],
  magic: ["#2E1065", "#7C3AED", "#C084FC", "#F0ABFC", "#FDF4FF"],
  abstract: ["#111827", "#2563EB", "#E11D48", "#F59E0B", "#F8FAFC"],
  bauhaus: ["#111827", "#DC2626", "#2563EB", "#FACC15", "#F8FAFC"],
  memphis: ["#111827", "#F472B6", "#FACC15", "#2DD4BF", "#F8FAFC"],
  watercolor: ["#BAE6FD", "#C7D2FE", "#FBCFE8", "#FED7AA", "#DCFCE7"],
  grain: ["#1C1917", "#57534E", "#A8A29E", "#D6D3D1", "#FAFAF9"],
  gradient: ["#7C3AED", "#0EA5E9", "#10B981", "#FACC15", "#F97316"],
  blur: ["#172554", "#2563EB", "#C4B5FD", "#FBCFE8", "#F8FAFC"],
  shadow: ["#020617", "#111827", "#374151", "#9CA3AF", "#F9FAFB"],
  liquid: ["#082F49", "#0891B2", "#22D3EE", "#C4B5FD", "#F8FAFC"],
};

const fallbackColors = ["#111827", "#4F46E5", "#06B6D4", "#F472B6", "#F8FAFC"];

function colorsFor(name: string, fallback?: string[]): string[] {
  const key = name.toLowerCase();
  const match = Object.entries(COLOR_SEEDS).find(([token]) => key.includes(token));
  return fallback ?? (match ? match[1] : fallbackColors);
}

function descriptionFor(type: LibraryType, name: string, group: string): string {
  if (type === "Effect") return `${name} treatment with color stops tuned for visual preview and palette generation.`;
  if (type === "Aesthetic") return `${name} visual direction for ${group.toLowerCase()} interface and brand work.`;
  return `${name} palette reference from the ${group.toLowerCase()} collection.`;
}

function make(type: LibraryType, group: string, names: string[], fallback?: string[]): DesignLibraryItem[] {
  return names.map((name) => ({
    id: id(type, group, name),
    name,
    type,
    group,
    category: group,
    description: descriptionFor(type, name, group),
    colors: colorsFor(name, fallback).map((hex) => normalizeHex(hex) ?? "#000000"),
    tags: [type, group, ...name.split(/[\s/]+/).filter(Boolean).slice(0, 3)],
  }));
}

export const PALETTE_LIBRARY_GROUPS = {
  "Color Relationships": ["Monochromatic", "Complementary", "Analogous", "Triadic", "Tetradic", "Split Complementary", "Double Complementary", "Square", "Rectangle", "Accented Analogous"],
  "Color Families": ["Monochrome", "Black & White", "Grayscale", "Silver", "Slate", "Charcoal", "Navy", "Cobalt", "Azure", "Cyan", "Teal", "Emerald", "Forest", "Lime", "Olive", "Yellow", "Gold", "Amber", "Orange", "Coral", "Red", "Crimson", "Rose", "Pink", "Magenta", "Purple", "Violet", "Indigo"],
  Mood: ["Pastel", "Vibrant", "Muted", "Soft", "Neon", "Dark", "Light", "Earthy", "Warm", "Cool", "Neutral", "Elegant", "Luxury", "Playful", "Calm", "Energetic", "Romantic", "Mysterious", "Futuristic", "Professional"],
  Nature: ["Ocean", "Sky", "Forest", "Moss", "Desert", "Sand", "Earth", "Autumn", "Spring", "Summer", "Winter", "Sunset", "Sunrise", "Aurora", "Tropical", "Arctic"],
  "Popular Aesthetics": ["Cyberpunk", "Synthwave", "Vaporwave", "Y2K", "Cybercore", "Dark Academia", "Light Academia", "Gothic", "Cottagecore", "Fairycore", "Dreamcore", "Weirdcore", "Frutiger Aero", "Retro", "Vintage", "Minimalist", "Maximalist"],
} as const;

export const AESTHETIC_LIBRARY_GROUPS = {
  Modern: ["Minimalism", "Swiss Design", "Modernism", "Brutalism", "Neo-Brutalism", "Glassmorphism", "Neumorphism", "Claymorphism", "Soft UI", "Flat Design", "Material Design", "Fluent Design", "Bento UI", "Card-based UI", "Editorial Design"],
  "Futuristic / Technology": ["Futuristic", "Sci-Fi", "Cyberpunk", "Cybercore", "Techwear", "Holographic", "Digital", "AI Interface", "HUD", "CRT", "Terminal", "Matrix", "Quantum", "Cybernetic", "Space", "Cosmic", "Biotech"],
  Luxury: ["Luxury", "High Fashion", "Editorial", "Art Deco", "Sophisticated", "Premium Minimal", "Black & Gold", "Dark Luxury", "Glass Luxury", "Metallic", "Chrome", "Liquid Metal"],
  "Dark / Atmospheric": ["Dark Mode", "Gothic", "Gothic Luxury", "Dark Academia", "Dark Fantasy", "Eldritch", "Occult", "Mystical", "Abyss", "Noir", "Cinematic", "Atmospheric", "Moody"],
  Nature: ["Organic", "Botanical", "Forest", "Ocean", "Tropical", "Desert", "Alpine", "Arctic", "Earthy", "Biophilic", "Eco", "Natural", "Zen"],
  Retro: ["70s", "80s", "90s", "Y2K", "Retro Futurism", "Synthwave", "Vaporwave", "Arcade", "Pixel Art", "CRT", "VHS", "Film", "Polaroid", "Cassette", "Retro Computer"],
  Fantasy: ["High Fantasy", "Dark Fantasy", "Medieval", "Fairytale", "Magical", "Enchanted Forest", "Wizardry", "Mythology", "Elven", "Royal", "Castle", "Gothic Fantasy"],
  "Art / Creative": ["Abstract", "Surrealism", "Impressionism", "Expressionism", "Pop Art", "Memphis", "Collage", "Paper Cutout", "Hand-drawn", "Sketch", "Watercolor", "Ink", "Grainy", "Filmic", "Bauhaus"],
  Playful: ["Cartoon", "Kawaii", "Cute", "Candy", "Bubble", "Toy", "Sticker", "Comic", "Doodle", "Memphis", "Clay"],
  "Web / Product": ["SaaS", "Dashboard", "Developer Tool", "Creative Tool", "Portfolio", "Landing Page", "Marketplace", "E-commerce", "Social", "Productivity", "Finance", "Gaming", "Music", "AI / Generative", "Data Visualization"],
} as const;

export const VISUAL_EFFECTS = ["Gradient", "Mesh Gradient", "Aurora Gradient", "Radial Glow", "Neon Glow", "Bloom", "Blur", "Gaussian Blur", "Glass", "Frosted Glass", "Noise", "Grain", "Film Grain", "Scanlines", "Chromatic Aberration", "Glitch", "CRT", "Pixelation", "Halftone", "Dithering", "Vignette", "Shadow", "Inner Shadow", "Drop Shadow", "Long Shadow", "Reflection", "Metallic", "Chrome", "Liquid", "Iridescent", "Holographic", "Prismatic", "Refraction", "Transparency"] as const;

const paletteEntries = Object.entries(PALETTE_LIBRARY_GROUPS).flatMap(([group, names]) => make("Palette", group, [...names]));
const aestheticEntries = Object.entries(AESTHETIC_LIBRARY_GROUPS).flatMap(([group, names]) => make("Aesthetic", group, [...names]));
const effectEntries = make("Effect", "Visual Effects", [...VISUAL_EFFECTS]);

export const DESIGN_LIBRARY: DesignLibraryItem[] = [...paletteEntries, ...aestheticEntries, ...effectEntries];
export const DESIGN_LIBRARY_TYPES: Array<"All" | LibraryType> = ["All", "Palette", "Aesthetic", "Effect"];
export const DESIGN_LIBRARY_CATEGORIES = ["All", ...new Set(DESIGN_LIBRARY.map((item) => item.category))];

function mix(a: string, b: string, amount: number): string {
  const first = hexToRgb(a), second = hexToRgb(b);
  return `#${[first.r, first.g, first.b].map((channel, index) => {
    const target = [second.r, second.g, second.b][index];
    return Math.round(channel + (target - channel) * amount).toString(16).padStart(2, "0");
  }).join("").toUpperCase()}`;
}

export function expandLibraryColors(colors: string[], count: number): string[] {
  const safeColors = colors.map((hex) => normalizeHex(hex)).filter((hex): hex is string => Boolean(hex));
  const stops = safeColors.length ? safeColors : fallbackColors;
  const nextCount = clampCount(count);
  if (nextCount <= stops.length) return stops.slice(0, nextCount);
  return Array.from({ length: nextCount }, (_, index) => {
    const position = index / Math.max(1, nextCount - 1);
    const scaled = position * (stops.length - 1);
    const left = Math.floor(scaled);
    const right = Math.min(stops.length - 1, left + 1);
    return mix(stops[left], stops[right], scaled - left);
  });
}

export function paletteFromLibraryItem(item: DesignLibraryItem, count = item.colors.length, existing: Color[] = []): Palette {
  const generated = expandLibraryColors(item.colors, count);
  return {
    mode: "Random",
    colors: generated.map((hex, index) => existing[index]?.locked ? { ...existing[index] } : { id: uid(), hex, locked: false }),
  };
}

export const LIBRARY_COUNTS = {
  palettes: paletteEntries.length,
  aesthetics: aestheticEntries.length,
  effects: effectEntries.length,
};
