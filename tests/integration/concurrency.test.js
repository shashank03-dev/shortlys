import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { createLink } from "@/lib/links/create-link";
import { createQr } from "@/lib/qr/create-qr";
import { checkRateLimit } from "@/lib/rate-limit";

describe("concurrent writes", () => {
  it("creates exactly one custom alias under contention", async () => {
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => createLink({
      userId: "race_user", url: "https://example.com", alias: "race-alias",
    })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected").every((r) => r.reason.status === 409)).toBe(true);
    expect(await prisma.url.count()).toBe(1);
  });

  it("creates 50 unique generated aliases", async () => {
    const urls = await Promise.all(Array.from({ length: 50 }, () => createLink({ userId: "race_user", url: "https://example.com" })));
    expect(new Set(urls.map((u) => u.shorturl)).size).toBe(50);
    expect(await prisma.url.count()).toBe(50);
  });

  it("attaches exactly one QR to the same link", async () => {
    await createLink({ userId: "race_user", url: "https://example.com", alias: "same-link" });
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => createQr({
      userId: "race_user", input: { mode: "existing", shorturl: "same-link" }, baseUrl: "http://localhost:3100",
    })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected").every((r) => r.reason.code === "QR_EXISTS")).toBe(true);
    expect(await prisma.qrCode.count()).toBe(1);
  });

  it("does not fail open on a simultaneous first rate-limit bucket", async () => {
    const results = await Promise.all(Array.from({ length: 200 }, () => checkRateLimit({
      key: "race", limit: 5, windowMs: 3_600_000,
    })));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    expect((await prisma.rateLimit.findFirst()).count).toBe(200);
  });
});
