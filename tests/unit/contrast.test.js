import { describe, expect, it } from "vitest";
import { assertContrast, getContrastRatio, isHexColor } from "@/lib/qr/contrast";

describe("contrast", () => {
  it("returns 21 for black on white", () => {
    expect(getContrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical colors", () => {
    expect(getContrastRatio("#111827", "#111827")).toBe(1);
  });

  it("validates hex colors and rejects low contrast", () => {
    expect(isHexColor("#fff")).toBe(false);
    expect(() => getContrastRatio("white", "#fff")).toThrow();
    expect(() => assertContrast("#777777", "#888888")).toThrow("contrast");
  });
});
