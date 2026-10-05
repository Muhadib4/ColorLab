import test from "node:test";
import assert from "node:assert/strict";
import { createGradient, generateGradient, gradientCss, GRADIENT_MODES } from "../src/lib/gradient";
import { GRADIENT_PRESETS } from "../src/lib/presets";
import { exportGradient, exportPalette, parseSharedCreation, serializeCreation, validateCreation } from "../src/lib/serialization";
import type { Creation, Gradient } from "../src/types";

test("palette integration spaces valid stops and guarantees two to eight stops", () => {
  const gradient = createGradient(["#abc", "#123456", "#FFFFFF"]);
  assert.deepEqual(gradient.stops.map(({ color, position }) => ({ color, position })), [{ color: "#AABBCC", position: 0 }, { color: "#123456", position: 50 }, { color: "#FFFFFF", position: 100 }]);
  assert.equal(createGradient([]).stops.length, 2);
  assert.equal(createGradient(["#fff", "invalid"]).stops.length, 2);
  assert.equal(createGradient(Array.from({ length: 20 }, () => "#ABCDEF")).stops.length, 8);
  assert.equal(createGradient(["#000", "#fff"], 500).angle, 360);
});

test("CSS generation supports all gradient types and preserves stop order without mutation", () => {
  const gradient = createGradient(["#000000", "#FFFFFF"], 90);
  gradient.stops.reverse();
  const firstId = gradient.stops[0].id;
  assert.equal(gradientCss(gradient), "linear-gradient(90deg, #000000 0%, #FFFFFF 100%)");
  assert.equal(gradient.stops[0].id, firstId);
  assert.equal(gradientCss({ ...gradient, type: "radial", shape: "circle", position: "top left" }), "radial-gradient(circle at top left, #000000 0%, #FFFFFF 100%)");
  assert.equal(gradientCss({ ...gradient, type: "conic" }), "conic-gradient(from 90deg at center, #000000 0%, #FFFFFF 100%)");
  assert.ok(exportGradient(gradient, "tailwind").startsWith("bg-[linear-gradient(90deg,_"));
  assert.equal(exportGradient(gradient, "css"), `background: ${gradientCss(gradient)};`);
});

test("all gradient generation modes and curated presets produce valid bounded designs", () => {
  for (const mode of GRADIENT_MODES) {
    const gradient = generateGradient(mode);
    assert.ok(validateCreation({ kind: "gradient", gradient }));
  }
  assert.equal(GRADIENT_PRESETS.length, 24);
  assert.equal(new Set(GRADIENT_PRESETS.map((preset) => preset.name)).size, 24);
  for (const category of ["Aurora", "Sunset", "Ocean", "Cyber", "Pastel", "Fire", "Forest", "Lavender", "Midnight", "Neon", "Candy", "Ice", "Peach", "Gold", "Synthwave", "Arctic", "Sakura"]) assert.ok(GRADIENT_PRESETS.some((preset) => preset.category === category));
  for (const preset of GRADIENT_PRESETS) assert.ok(validateCreation({ kind: "gradient", gradient: createGradient(preset.colors, preset.angle) }));
});

test("shared palettes round-trip mode, colors and lock positions", () => {
  const creation: Creation = { kind: "palette", palette: { mode: "Split Complementary", colors: [{ id: "a", hex: "#7C3AED", locked: true }, { id: "b", hex: "#123456", locked: false }, { id: "c", hex: "#FBCFE8", locked: true }] } };
  const parsed = parseSharedCreation(`?${serializeCreation(creation)}`);
  assert.equal(parsed?.kind, "palette");
  if (parsed?.kind !== "palette") return;
  assert.equal(parsed.palette.mode, creation.palette.mode);
  assert.deepEqual(parsed.palette.colors.map(({ hex, locked }) => ({ hex, locked })), creation.palette.colors.map(({ hex, locked }) => ({ hex, locked })));
  assert.ok(exportPalette(parsed.palette, "css").includes("--color-1: #7C3AED;"));
  assert.equal(JSON.parse(exportPalette(parsed.palette, "json")).colors.length, 3);
  assert.ok(exportPalette(parsed.palette, "svg").startsWith("<svg "));
  assert.ok(parseSharedCreation("?colors=fff,000,abc"));
  const custom: Creation = { kind: "palette", palette: { mode: "Random", colors: Array.from({ length: 20 }, (_, index) => ({ id: `custom-${index}`, hex: "#ABCDEF", locked: index % 5 === 0 })) } };
  const parsedCustom = parseSharedCreation(serializeCreation(custom));
  assert.equal(parsedCustom?.kind, "palette");
  if (parsedCustom?.kind === "palette") {
    assert.equal(parsedCustom.palette.colors.length, 20);
    assert.equal(JSON.parse(exportPalette(parsedCustom.palette, "json")).colors.length, 20);
  }
});

test("all shared gradient types round-trip every editable field", () => {
  for (const type of ["linear", "radial", "conic"] as const) {
    const gradient: Gradient = { ...createGradient(["#C4B5FD", "#2563EB", "#06B6D4"], 247), type, shape: "circle", position: "bottom right" };
    gradient.stops[1].position = 34.7;
    const parsed = parseSharedCreation(serializeCreation({ kind: "gradient", gradient }));
    assert.equal(parsed?.kind, "gradient");
    if (parsed?.kind === "gradient") assert.equal(gradientCss(parsed.gradient), gradientCss(gradient));
  }
});

test("malformed shared URLs and persisted designs are rejected safely", () => {
  for (const value of ["", "?unrelated=1", "?colors=fff", "?colors=foo,fff,000", "?colors=fff,000,abc&mode=Missing", "?colors=fff,000,abc&locks=9", "?colors=fff,000,abc&gradient=linear", "?gradient=linear&stops=fff:0,000:101", "?gradient=linear&stops=fff:0,000:100&angle=Infinity", "?gradient=radial&stops=fff:0,000:100&position=url(evil)", "?gradient=linear&stops=fff:,000:100", "?gradient=linear&stops=fff:0:3,000:100", "?gradient=linear&stops=fff:0,000:100&angle=", "a".repeat(8001)]) assert.equal(parseSharedCreation(value), null, value.slice(0, 100));
  for (const value of [null, [], {}, { kind: "palette", palette: null }, { kind: "gradient", gradient: { stops: [] } }]) assert.equal(validateCreation(value), null);
  const gradient = createGradient(["#FFF", "#000"]);
  gradient.stops[0].position = Number.NaN;
  assert.equal(validateCreation({ kind: "gradient", gradient }), null);
});

test("persisted IDs and locks survive validation; duplicate IDs are repaired", () => {
  const creation: Creation = { kind: "palette", palette: { mode: "Random", colors: [{ id: "saved-a", hex: "#FFFFFF", locked: true }, { id: "saved-b", hex: "#000000", locked: false }] } };
  assert.deepEqual(validateCreation(creation), creation);
  creation.palette.colors[1].id = "saved-a";
  const parsed = validateCreation(creation);
  if (parsed?.kind !== "palette") assert.fail("Palette was rejected");
  assert.notEqual(parsed.palette.colors[0].id, parsed.palette.colors[1].id);
});
