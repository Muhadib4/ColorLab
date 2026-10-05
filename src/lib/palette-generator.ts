import { hexToHsl, hslToHex, uid } from "./color";

export interface BaseColor { id: string; name: string; englishName: string; hex: string }
export interface GeneratedColor { id: string; name: string; hex: string; family: string }

export const BASE_COLORS: BaseColor[] = [
  ["Merah", "Red", "#EF4444"], ["Biru", "Blue", "#3B82F6"], ["Hijau", "Green", "#22C55E"], ["Kuning", "Yellow", "#FACC15"], ["Oranye", "Orange", "#F97316"], ["Ungu", "Purple", "#8B5CF6"], ["Putih", "White", "#FFFFFF"], ["Hitam", "Black", "#111827"], ["Merah Muda", "Pink", "#EC4899"], ["Cokelat", "Brown", "#8B5E3C"], ["Abu-abu", "Grey", "#6B7280"], ["Biru Langit", "Sky Blue", "#38BDF8"], ["Beige", "Beige", "#D6C2A3"], ["Violet", "Violet", "#7C3AED"], ["Magenta", "Magenta", "#D946EF"], ["Marun", "Maroon", "#7F1D1D"], ["Navy", "Navy", "#1E3A8A"], ["Teal", "Teal", "#0F766E"], ["Lavender", "Lavender", "#C4B5FD"], ["Peach", "Peach", "#FDBA74"], ["Olive", "Olive", "#6B7A2F"], ["Silver", "Silver", "#A8B0BC"], ["Gold", "Gold", "#D4A72C"], ["Indigo", "Indigo", "#4F46E5"], ["Coral", "Coral", "#F87171"], ["Mint", "Mint", "#6EE7B7"], ["Plum", "Plum", "#7E2952"], ["Salmon", "Salmon", "#FA8072"], ["Tan", "Tan", "#C19A6B"], ["Toska", "Turquoise", "#2DD4BF"],
].map(([name, englishName, hex], index) => ({ id: `base-${index}`, name, englishName, hex }));

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const hue = (value: number) => ((value % 360) + 360) % 360;

export function generateColorVariations(base: BaseColor): GeneratedColor[] {
  const { h, s, l } = hexToHsl(base.hex);
  const recipes: Array<[string, number, number, number, string]> = [
    ["Light", 0, -8, 24, "Tint"], ["Soft", 0, -18, 16, "Tint"], ["Pastel", 8, -28, 26, "Pastel"], ["Baby", -5, -34, 25, "Pastel"], ["Powder", 12, -38, 16, "Pastel"],
    ["Bright", 0, 12, 12, "Vibrant"], ["Vivid", 5, 22, 6, "Vibrant"], ["Electric", -8, 30, 2, "Vibrant"], ["Royal", -4, 14, -4, "Vibrant"], ["Deep", 2, 10, -18, "Shade"],
    ["Dark", 0, 2, -27, "Shade"], ["Midnight", -8, -8, -38, "Shade"], ["Muted", 0, -25, -4, "Tone"], ["Dusty", 10, -32, 3, "Tone"], ["Smoky", -12, -38, -10, "Tone"],
    ["Warm", -22, 5, 0, "Harmony"], ["Cool", 22, 5, 0, "Harmony"], ["Analogous light", -25, -4, 10, "Harmony"], ["Analogous dark", 25, 4, -10, "Harmony"], ["Complement", 180, 4, 0, "Harmony"],
    ["Complement light", 180, -6, 18, "Harmony"], ["Complement deep", 180, 6, -18, "Harmony"], ["Triad one", 120, 5, 2, "Harmony"], ["Triad two", 240, 5, 2, "Harmony"], ["Split one", 150, 4, 1, "Harmony"], ["Split two", 210, 4, 1, "Harmony"],
    ["Near black", 0, -12, -45, "Shade"], ["Near white", 0, -42, 43, "Tint"], ["Natural", 0, -10, 0, "Base"], ["Balanced", 0, 0, 0, "Base"], ["Luminous", 0, 8, 20, "Light"], ["Grounded", 0, -12, -14, "Deep"],
  ];
  const used = new Set<string>();
  return recipes.map(([label, hueShift, saturationShift, lightnessShift, family], index) => {
    const hex = hslToHex(hue(h + hueShift), clamp(s + saturationShift), clamp(l + lightnessShift));
    let uniqueHex = hex;
    let attempt = 0;
    while (used.has(uniqueHex) && attempt < 100) {
      attempt += 1;
      const fallbackSaturation = s < 8 ? 0 : clamp(s + ((index + attempt) % 5 - 2) * 5);
      const fallbackLightness = clamp(8 + ((index * 17 + attempt * 11) % 84));
      uniqueHex = hslToHex(hue(h + hueShift + attempt * 3), fallbackSaturation, fallbackLightness);
    }
    used.add(uniqueHex);
    return { id: uid(), name: `${label} ${base.englishName}`, hex: uniqueHex, family };
  });
}

export function generateHarmonicPalette(base: BaseColor, mode: "Monochromatic" | "Analogous" | "Complementary" | "Triadic" | "Split Complementary"): GeneratedColor[] {
  const { h, s, l } = hexToHsl(base.hex);
  const offsets = mode === "Monochromatic" ? [0, 0, 0, 0, 0] : mode === "Analogous" ? [-30, -15, 0, 15, 30] : mode === "Complementary" ? [0, 180, 0, 180, 0] : mode === "Triadic" ? [0, 120, 240, 0, 120] : [0, 150, 210, 0, 150];
  return offsets.map((offset, index) => ({ id: uid(), name: `${mode} ${index + 1}`, hex: hslToHex(hue(h + offset), clamp(s + (index - 2) * 4), clamp(l + (index - 2) * 8)), family: mode }));
}
