import test from "node:test";
import assert from "node:assert/strict";
import { colorName, colorScale, contrastRatio, formatColor, generatePalette, hexToHsl, hexToHsv, hexToRgb, hslToHex, luminance, MAX_PALETTE_COLORS, normalizeHex, PALETTE_MODES, textColor } from "../src/lib/color";

test("HEX normalization accepts shorthand and rejects malformed colors", () => {
  assert.equal(normalizeHex(" abc "), "#AABBCC");
  assert.equal(normalizeHex("#7c3aed"), "#7C3AED");
  for (const hex of ["", "##ABC", "12345", "1234567", "transparent", "#GG00FF", "#FFFF"]) assert.equal(normalizeHex(hex), null);
});

test("color space conversions handle primary colors and achromatic endpoints", () => {
  assert.deepEqual(hexToRgb("#12ABFF"), { r: 18, g: 171, b: 255 });
  assert.deepEqual(hexToHsl("#FF0000"), { h: 0, s: 100, l: 50 });
  assert.deepEqual(hexToHsl("#808080"), { h: 0, s: 0, l: 50 });
  assert.deepEqual(hexToHsv("#00FF00"), { h: 120, s: 100, v: 100 });
  assert.deepEqual(hexToHsv("#000000"), { h: 0, s: 0, v: 0 });
  assert.equal(hslToHex(240, 100, 50), "#0000FF");
  assert.equal(hslToHex(-120, 100, 50), "#0000FF");
  assert.equal(hslToHex(720, 100, 50), "#FF0000");
  assert.equal(hslToHex(90, 100, 200), "#FFFFFF");
  assert.equal(hslToHex(Number.NaN, Number.NaN, Number.NaN), "#000000");
  assert.equal(formatColor("#00FF00", "RGB"), "rgb(0, 255, 0)");
  assert.equal(formatColor("#00FF00", "HSL"), "hsl(120, 100%, 50%)");
});

test("WCAG relative luminance and contrast use linearized sRGB", () => {
  assert.equal(luminance("#000000"), 0);
  assert.equal(luminance("#FFFFFF"), 1);
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastRatio("#757575", "#757575"), 1);
  assert.ok(Math.abs(contrastRatio("#777777", "#FFFFFF") - 4.478) < 0.001);
  assert.equal(textColor("#101020"), "#FFFFFF");
  assert.equal(textColor("#FAFAFF"), "#000000");
  assert.equal(colorName("#C4B5FD"), "Soft Lavender");
});

test("each palette harmony generates valid unique slots and respects locks", () => {
  const existing = [{ id: "a", hex: "#6D28D9", locked: true }, { id: "b", hex: "#F0ABFC", locked: false }, { id: "c", hex: "#38BDF8", locked: true }];
  for (const mode of PALETTE_MODES) {
    for (const count of [3, 4, 5, 6, 8, 16, 20]) {
      const colors = generatePalette(count, mode, existing);
      assert.equal(colors.length, count);
      assert.deepEqual(colors[0], existing[0]);
      assert.deepEqual(colors[2], existing[2]);
      assert.equal(colors[1].locked, false);
      assert.equal(new Set(colors.map((color) => color.id)).size, count);
      assert.ok(colors.every((color) => /^#[A-F\d]{6}$/.test(color.hex)));
    }
  }
  assert.equal(generatePalette(-4, "Random").length, 3);
  assert.equal(generatePalette(8, "Random").length, 8);
  assert.equal(generatePalette(16, "Random").length, 16);
  assert.equal(generatePalette(20, "Random").length, 20);
  assert.equal(generatePalette(99, "Random").length, MAX_PALETTE_COLORS);
  assert.equal(generatePalette(Number.NaN, "Random").length, 3);
});

test("color scales contain eleven bounded colors and change in the intended direction", () => {
  for (const kind of ["shades", "tints", "tones"] as const) {
    const scale = colorScale("#7C3AED", kind);
    assert.equal(scale.length, 11);
    assert.equal(scale[0].hex, "#7C3AED");
    assert.equal(scale[10].label, "950");
    assert.ok(scale.every((color) => normalizeHex(color.hex) === color.hex));
  }
  const dark = colorScale("#7C3AED", "shades");
  const light = colorScale("#7C3AED", "tints");
  assert.ok(dark.every((color, i) => i === 0 || luminance(color.hex) <= luminance(dark[i - 1].hex)));
  assert.ok(light.every((color, i) => i === 0 || luminance(color.hex) >= luminance(light[i - 1].hex)));
});
