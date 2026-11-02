import { describe, expect, it } from "vitest";
import { generateAlias, normalizeAlias, validateAlias } from "@/lib/qr/alias";

describe("aliases", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeAlias("  Launch-2026 ")).toBe("launch-2026");
  });

  it("rejects short, long, invalid, and reserved aliases", () => {
    expect(() => normalizeAlias("ab")).toThrow();
    expect(() => normalizeAlias("a".repeat(33))).toThrow();
    expect(() => normalizeAlias("has space")).toThrow();
    expect(() => normalizeAlias("api")).toThrow("reserved");
  });

  it("generates a valid 7-character alias", () => {
    const alias = generateAlias();
    expect(alias).toHaveLength(7);
    expect(validateAlias(alias)).toBe(true);
  });
});
