import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, after: (callback) => callback() };
});

const { GET } = await import("@/app/[shorturl]/route");

beforeEach(async () => {
  await prisma.visit.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.url.deleteMany();
});

describe("redirect route", () => {
  it("redirects with 307 and records a QR visit", async () => {
    const url = await prisma.url.create({ data: { url: "https://example.com/destination", shorturl: "abc123", userId: "user_a" } });
    await prisma.qrCode.create({ data: { urlId: url.id, userId: "user_a", fgColor: "#111827", bgColor: "#FFFFFF" } });

    const response = await GET(
      new Request("http://localhost/abc123?src=qr", { headers: { "user-agent": "Mozilla/5.0 Chrome/120", "x-vercel-ip-country": "GB" } }),
      { params: Promise.resolve({ shorturl: "abc123" }) },
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/destination");

    await new Promise((resolve) => setTimeout(resolve, 50));
    const visit = await prisma.visit.findFirst();
    expect(visit.source).toBe("qr");
    expect(visit.location).toBe("GB");
    const qr = await prisma.qrCode.findFirst();
    expect(qr.scanCount).toBe(1);
  });

  it("does not record HEAD requests or bots", async () => {
    await prisma.url.create({ data: { url: "https://example.com", shorturl: "skip-scans", userId: "user_a" } });
    for (const request of [new Request("http://localhost/skip-scans", { method: "HEAD" }), new Request("http://localhost/skip-scans", { headers: { "user-agent": "Googlebot" } })]) {
      expect((await GET(request, { params: Promise.resolve({ shorturl: "skip-scans" }) })).status).toBe(307);
    }
    expect(await prisma.visit.count()).toBe(0);
  });

  it("returns a controlled response for an invalid legacy destination", async () => {
    await prisma.url.create({ data: { url: "javascript:example.com", shorturl: "bad-legacy", userId: "user_a" } });
    const response = await GET(new Request("http://localhost/bad-legacy"), { params: Promise.resolve({ shorturl: "bad-legacy" }) });
    expect(response.status).toBe(503);
    expect(await prisma.visit.count()).toBe(0);
  });

  it("keeps redirecting when analytics storage fails", async () => {
    await prisma.url.create({ data: { url: "https://example.com", shorturl: "analytics-down", userId: "user_a" } });
    const insert = vi.spyOn(prisma.visit, "create").mockRejectedValueOnce(new Error("Injected analytics failure"));
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await GET(new Request("http://localhost/analytics-down"), { params: Promise.resolve({ shorturl: "analytics-down" }) });
      expect(response.status).toBe(307);
      await vi.waitFor(() => expect(logging).toHaveBeenCalled());
    } finally { insert.mockRestore(); logging.mockRestore(); }
  });

  it("returns 503 with retry headers when the lookup database is unavailable", async () => {
    const lookup = vi.spyOn(prisma.url, "findUnique").mockRejectedValueOnce(new Error("Injected lookup failure"));
    const logging = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await GET(new Request("http://localhost/unavailable"), { params: Promise.resolve({ shorturl: "unavailable" }) });
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("30");
    } finally { lookup.mockRestore(); logging.mockRestore(); }
  });
});
