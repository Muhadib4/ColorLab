export type ColorFormat = "HEX" | "RGB" | "HSL";
export interface Color { id: string; hex: string; locked: boolean }
export interface Palette { colors: Color[]; mode: PaletteMode }
export type PaletteMode = "Random" | "Monochromatic" | "Analogous" | "Complementary" | "Split Complementary" | "Triadic" | "Tetradic" | "Warm" | "Cool" | "Pastel" | "Vibrant" | "Muted" | "Dark" | "Light";
export type GradientType = "linear" | "radial" | "conic";
export type GradientMode = "Smooth" | "Vibrant" | "Pastel" | "Neon" | "Dark" | "Warm" | "Cool";
export interface GradientStop { id: string; color: string; position: number }
export interface Gradient { type: GradientType; angle: number; shape: "circle" | "ellipse"; position: string; stops: GradientStop[] }
export interface GradientPreset { name: string; category: string; colors: string[]; angle: number }
export type StudioTab = "studio" | "colorlab" | "gradient" | "saved" | "history";
export type Creation = { kind: "palette"; palette: Palette } | { kind: "gradient"; gradient: Gradient };
export type SavedCreation = Creation & { id: string; name: string; createdAt: string };
export interface AppSettings { theme: "dark" | "light" | "system"; sfx: boolean; sfxVolume: number; ambient: boolean; ambientVolume: number; muted: boolean; motion: "full" | "reduced"; format: ColorFormat }
export type Notify = (message: string, tone?: "success" | "error") => void;
export type CopyValue = (value: string, label?: string) => Promise<void>;
