import { describe, expect, it, vi } from "vitest";
import { jsonError } from "@/lib/api/errors";

describe("API error privacy and availability", () => {
  it("maps database connection failures to a retryable 503", async () => {
    const response = jsonError(Object.assign(new Error("internal DB address"), { code: "P1001" }));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("never exposes unknown error details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = jsonError(Object.assign(new Error("secret"), { details: { password: "secret" } }));
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});
