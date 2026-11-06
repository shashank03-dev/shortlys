import { describe, expect, it } from "vitest";
import { parseJson } from "@/lib/api/request";
import { createQrSchema } from "@/lib/qr/schemas";

describe("JSON input boundaries", () => {
  it("rejects oversized streamed bodies before parsing", async () => {
    const request = new Request("http://localhost/api/qr", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com", extra: "x".repeat(140000) }),
    });
    await expect(parseJson(request, createQrSchema)).rejects.toMatchObject({ status: 413 });
  });

  it("returns useful errors for wrong content type and invalid JSON", async () => {
    await expect(parseJson(new Request("http://localhost", { method: "POST", body: "{}" }), createQrSchema)).rejects.toMatchObject({ status: 415 });
    await expect(parseJson(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: "{" }), createQrSchema)).rejects.toMatchObject({ status: 400, code: "INVALID_JSON" });
  });
});
