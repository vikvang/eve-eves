import { describe, expect, it } from "vitest";
import { color, hexToRgb, SWEETIE16 } from "./palette.js";
import { spriteFromGrid } from "./sprite.js";

describe("SWEETIE16", () => {
  it("has 16 colors", () => {
    expect(SWEETIE16).toHaveLength(16);
  });

  it("returns hex by index", () => {
    expect(color(0)).toBe("#1a1c2c");
    expect(color(12)).toBe("#f4f4f4");
  });

  it("parses hex to rgb", () => {
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
    expect(hexToRgb(SWEETIE16[0])).toEqual([0x1a, 0x1c, 0x2c]);
  });
});

describe("spriteFromGrid", () => {
  it("produces a png data url", () => {
    const url = spriteFromGrid(["#.", ".#"], { ".": "transparent", "#": 12 });
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
    expect(url.length).toBeGreaterThan(40);
  });

  it("rejects empty grids", () => {
    expect(() => spriteFromGrid([], {})).toThrow(/empty/);
  });
});
