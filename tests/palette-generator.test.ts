import test from "node:test";
import assert from "node:assert/strict";
import { BASE_COLORS, generateColorVariations, generateHarmonicPalette } from "../src/lib/palette-generator";

 test("palette generator exposes 30 requested base colors", () => {
  assert.equal(BASE_COLORS.length, 30);
  assert.equal(BASE_COLORS[0].englishName, "Red");
  assert.equal(BASE_COLORS[29].englishName, "Turquoise");
  assert.ok(BASE_COLORS.every(color => /^#[A-F\d]{6}$/.test(color.hex)));
});

test("each base color creates a substantial unique variation set", () => {
  for (const base of BASE_COLORS) {
    const variations = generateColorVariations(base);
    assert.equal(variations.length, 32);
    assert.equal(new Set(variations.map(color => color.hex)).size, variations.length);
    assert.ok(variations.every(color => /^#[A-F\d]{6}$/.test(color.hex)));
  }
});

test("harmonic palettes stay bounded and unique by id", () => {
  for (const mode of ["Monochromatic", "Analogous", "Complementary", "Triadic", "Split Complementary"] as const) {
    const colors = generateHarmonicPalette(BASE_COLORS[1], mode);
    assert.equal(colors.length, 5);
    assert.equal(new Set(colors.map(color => color.id)).size, 5);
    assert.ok(colors.every(color => /^#[A-F\d]{6}$/.test(color.hex)));
  }
});
