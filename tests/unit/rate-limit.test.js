import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
vi.mock("@/lib/prisma", () => ({ default: { $runCommandRaw: upsert, rateLimit: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) } } }));

const { checkRateLimit, enforceQrLimits } = await import("@/lib/rate-limit");

describe("rate limit", () => {
  beforeEach(() => {
    upsert.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("allows requests under the limit", async () => {
    upsert.mockResolvedValue({ value: { count: 2 } });
    const result = await checkRateLimit({ key: "test", limit: 10, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(8);
  });

  it("denies requests over the limit", async () => {
    upsert.mockResolvedValue({ value: { count: 11 } });
    const result = await checkRateLimit({ key: "test", limit: 10, windowMs: 60000 });
    expect(result.allowed).toBe(false);
  });

  it("fails open when the limiter returns no record", async () => {
    upsert.mockReturnValue(undefined);
    const result = await checkRateLimit({ key: "test", limit: 10, windowMs: 60000 });
    expect(result.allowed).toBe(true);
  });

  it("throws a 429 after the minute limit", async () => {
    upsert.mockResolvedValue({ value: { count: 11 } });
    await expect(enforceQrLimits("user")).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });
});
