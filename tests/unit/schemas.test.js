import { describe, expect, it } from "vitest";
import { createQrSchema, updateQrSchema } from "@/lib/qr/schemas";

describe("schemas", () => {
  it("accepts a new QR and defaults", () => {
    const parsed = createQrSchema.parse({ mode: "new", url: "https://example.com" });
    expect(parsed.mode).toBe("new");
  });

  it("rejects an unknown mode and invalid style", () => {
    expect(createQrSchema.safeParse({ mode: "text", url: "https://example.com" }).success).toBe(false);
    expect(createQrSchema.safeParse({ mode: "new", url: "https://example.com", style: { size: 123 } }).success).toBe(false);
  });

  it("requires at least one update field", () => {
    expect(updateQrSchema.safeParse({}).success).toBe(false);
    expect(updateQrSchema.safeParse({ label: null }).success).toBe(true);
  });

});
