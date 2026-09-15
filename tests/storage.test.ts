import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, readStudio, STORAGE_KEY, writeStudio, type PersistedStudio } from "../src/lib/storage";
import { createGradient } from "../src/lib/gradient";
import type { Creation, SavedCreation } from "../src/types";

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

function storageStub(options: { raw?: string; blockedRead?: boolean; blockedWrite?: boolean } = {}) {
  const values = new Map<string, string>();
  if (options.raw !== undefined) values.set(STORAGE_KEY, options.raw);
  const storage: Storage = {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) {
      if (options.blockedRead) throw new Error("Storage disabled");
      return values.get(key) ?? null;
    },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) {
      if (options.blockedWrite) throw new Error("Quota exceeded");
      values.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  return values;
}

const palette: Creation = { kind: "palette", palette: { mode: "Analogous", colors: [{ id: "violet", hex: "#7C3AED", locked: true }, { id: "blue", hex: "#2563EB", locked: false }, { id: "cyan", hex: "#06B6D4", locked: false }] } };
function fixture(): PersistedStudio {
  const gradient: Creation = { kind: "gradient", gradient: createGradient(["#7C3AED", "#06B6D4"]) };
  const saved: SavedCreation = { ...palette, id: "saved-1", name: "Ocean study", createdAt: "2026-09-16T09:00:00.000Z" };
  return { palette, gradient, saved: [saved], recent: [saved], settings: { ...DEFAULT_SETTINGS, theme: "light", ambient: true, sfxVolume: 0.6, format: "HSL" } };
}

test("an empty browser store starts cleanly and a workspace round-trips", () => {
  const values = storageStub();
  assert.deepEqual(readStudio(), { data: null, available: true });
  const workspace = fixture();
  assert.equal(writeStudio(workspace), true);
  assert.ok(values.has(STORAGE_KEY));
  assert.deepEqual(readStudio(), { data: workspace, available: true });
});

test("blocked storage and exceeded quota fail gracefully", () => {
  storageStub({ blockedRead: true });
  assert.deepEqual(readStudio(), { data: null, available: false });
  storageStub({ blockedWrite: true });
  assert.equal(writeStudio(fixture()), false);
});

test("corrupted JSON and invalid draft shapes do not reach the workspace", () => {
  storageStub({ raw: "{truncated" });
  assert.equal(readStudio().data, null);
  storageStub({ raw: JSON.stringify({ palette: { kind: "palette", palette: { colors: [] } }, gradient: { kind: "gradient", gradient: { stops: null } } }) });
  const { data, available } = readStudio();
  assert.equal(available, true);
  assert.equal(data?.palette, undefined);
  assert.equal(data?.gradient, undefined);
  assert.deepEqual(data?.saved, []);
});

test("settings are validated and volumes are clamped before use", () => {
  storageStub({ raw: JSON.stringify({ settings: { theme: "neon", motion: "extreme", format: "HSV", sfx: "yes", sfxVolume: 8, ambientVolume: -3, ambient: true, muted: false } }) });
  assert.deepEqual(readStudio().data?.settings, { ...DEFAULT_SETTINGS, sfxVolume: 1, ambientVolume: 0, ambient: true });
  storageStub({ raw: JSON.stringify({ settings: { sfxVolume: null, ambientVolume: "loud" } }) });
  assert.equal(readStudio().data?.settings?.sfxVolume, DEFAULT_SETTINGS.sfxVolume);
  assert.equal(readStudio().data?.settings?.ambientVolume, DEFAULT_SETTINGS.ambientVolume);
});

test("invalid saved entries are isolated without discarding valid creations", () => {
  const valid = fixture().saved[0];
  storageStub({ raw: JSON.stringify({ saved: [null, { ...valid, createdAt: "not-a-date" }, { ...valid, name: 12 }, { ...valid, palette: null }, { ...valid, name: "x".repeat(120) }] }) });
  const result = readStudio().data?.saved;
  assert.equal(result?.length, 1);
  assert.equal(result?.[0].name.length, 80);
  assert.equal(result?.[0].kind, "palette");
  if (result?.[0].kind === "palette") assert.equal(result[0].palette.colors[0].locked, true);
});

test("recent history remains bounded when loading oversized stored data", () => {
  const valid = fixture().saved[0];
  storageStub({ raw: JSON.stringify({ recent: Array.from({ length: 75 }, (_, index) => ({ ...valid, id: `history-${index}` })) }) });
  const result = readStudio().data?.recent;
  assert.equal(result?.length, 30);
  assert.equal(result?.[0].id, "history-0");
  assert.equal(result?.[29].id, "history-29");
});
