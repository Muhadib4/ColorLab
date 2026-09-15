import type { AppSettings, Creation, SavedCreation } from "@/types";
import { validateCreation } from "@/lib/serialization";

export const STORAGE_KEY = "colorlab.studio.v1";
export const DEFAULT_SETTINGS: AppSettings = { theme: "dark", sfx: true, sfxVolume: 0.35, ambient: false, ambientVolume: 0.35, muted: false, motion: "full", format: "HEX" };
export interface PersistedStudio { palette: Creation; gradient: Creation; saved: SavedCreation[]; recent: SavedCreation[]; settings: AppSettings }
function object(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function volume(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback; }
function settingsFrom(value: unknown): AppSettings {
  if (!object(value)) return DEFAULT_SETTINGS;
  return { theme: value.theme === "light" || value.theme === "system" ? value.theme : "dark", sfx: typeof value.sfx === "boolean" ? value.sfx : true, sfxVolume: volume(value.sfxVolume, 0.35), ambient: value.ambient === true, ambientVolume: volume(value.ambientVolume, 0.35), muted: value.muted === true, motion: value.motion === "reduced" ? "reduced" : "full", format: value.format === "RGB" || value.format === "HSL" ? value.format : "HEX" };
}
function savedFrom(value: unknown, max: number): SavedCreation[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).flatMap(item => {
    if (!object(item) || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))) return [];
    const creation = validateCreation(item);
    return creation ? [{ ...creation, id: item.id, name: item.name.slice(0, 80), createdAt: item.createdAt }] : [];
  });
}
export function readStudio(): { data: Partial<PersistedStudio> | null; available: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: null, available: true };
    const value: unknown = JSON.parse(raw);
    if (!object(value)) return { data: null, available: true };
    return { data: { palette: validateCreation(value.palette) ?? undefined, gradient: validateCreation(value.gradient) ?? undefined, saved: savedFrom(value.saved, 500), recent: savedFrom(value.recent, 30), settings: settingsFrom(value.settings) }, available: true };
  } catch { return { data: null, available: false }; }
}
export function writeStudio(studio: PersistedStudio): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(studio)); return true; } catch { return false; }
}
