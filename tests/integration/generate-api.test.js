import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";

const { getAuth } = vi.hoisted(() => ({ getAuth: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ getAuth }));

const { POST } = await import("@/app/api/generate/route");
const { GET: userUrls } = await import("@/app/api/user-urls/route");
const { GET: dashboardData } = await import("@/app/api/dashboard-data/route");
const { GET: analytics } = await import("@/app/api/analytics/route");
const { GET: health } = await import("@/app/api/health/route");

function request(body) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  getAuth.mockReset();
  getAuth.mockReturnValue({ userId: "user_a" });
});

describe("generate and dashboard APIs", () => {
  it("returns a short link with legacy fields", async () => {
    const response = await POST(request({ url: "example.com/path" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.shorturl).toMatch(/^[a-z0-9]{7}$/);
    expect(body.url).toBe("https://example.com/path");
  });

  it("returns proper auth and validation statuses", async () => {
    getAuth.mockReturnValue({ userId: null });
    expect((await POST(request({ url: "example.com" }))).status).toBe(401);
    getAuth.mockReturnValue({ userId: "user_a" });
    expect((await POST(request({ url: "javascript:alert(1)" }))).status).toBe(400);
  });

  it("returns 409 for a taken alias", async () => {
    await prisma.url.create({ data: { url: "https://example.com", shorturl: "taken", userId: "user_a" } });
    expect((await POST(request({ url: "https://example.com/other", shorturl: "taken" }))).status).toBe(409);
  });

  it("orders user URLs and includes QR summaries", async () => {
    const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "withqr1", userId: "user_a" } });
    await prisma.qrCode.create({ data: { urlId: url.id, userId: "user_a", fgColor: "#111827", bgColor: "#FFFFFF", scanCount: 4 } });
    const response = await userUrls(new Request("http://localhost/api/user-urls"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.urls[0].qrCode.scanCount).toBe(4);
  });

  it("returns QR scan totals and visit sources", async () => {
    const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "scan123", userId: "user_a" } });
    await prisma.qrCode.create({ data: { urlId: url.id, userId: "user_a", fgColor: "#111827", bgColor: "#FFFFFF", scanCount: 99 } });
    await prisma.visit.createMany({ data: [
      { urlId: url.id, device: "Mobile", os: "iOS", browser: "Safari", location: "US", source: "qr" },
      { urlId: url.id, device: "Mobile", os: "iOS", browser: "Safari", location: "US", source: "qr" },
      { urlId: url.id, device: "Desktop", os: "MacOS", browser: "Safari", location: "US", source: null },
    ] });
    const response = await dashboardData(new Request("http://localhost/api/dashboard-data"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.analytics.qrScans).toBe(2);
    expect(body.analytics.visits).toHaveLength(3);
    expect(body.analytics.visits.some((visit) => visit.source === "qr")).toBe(true);
  });

  it("caps dashboard visits globally across links", async () => {
    const urls = await Promise.all(["global-one", "global-two"].map((shorturl) => prisma.url.create({
      data: { url: "https://example.com", shorturl, userId: "user_a" },
    })));
    await prisma.visit.createMany({ data: urls.flatMap((url) => Array.from({ length: 2600 }, () => ({
      urlId: url.id, device: "Desktop", os: "Linux", browser: "Firefox", location: "US",
    }))) });
    const body = await (await dashboardData(new Request("http://localhost/api/dashboard-data"))).json();
    expect(body.analytics.visits).toHaveLength(5000);
    expect(body.analytics.truncated).toBe(true);
    expect(body.analytics.totalVisits).toBe(5200);
    expect(body.urls.map((url) => url.visitCount)).toEqual([2600, 2600]);
  });

  it("returns empty analytics for a user with no links", async () => {
    const body = await (await analytics(new Request("http://localhost/api/analytics"))).json();
    expect(body.data).toMatchObject({ totalVisits: 0, devices: {}, locations: {}, visitsOverTime: [], urls: [] });
  });

  it("keeps lifetime analytics private while charting the last seven days", async () => {
    const own = await prisma.url.create({ data: { url: "https://example.com", shorturl: "own-stats", userId: "user_a" } });
    const other = await prisma.url.create({ data: { url: "https://example.com", shorturl: "other-stats", userId: "user_b" } });
    await prisma.visit.createMany({ data: [
      { urlId: own.id, createdAt: new Date() },
      { urlId: own.id, createdAt: new Date("2020-01-01") },
      { urlId: other.id, createdAt: new Date() },
    ].map((visit) => ({ ...visit, device: "Mobile", os: "iOS", browser: "Safari", location: "US" })) });
    const body = await (await analytics(new Request("http://localhost/api/analytics"))).json();
    expect(body.data.totalVisits).toBe(2);
    expect(body.data.devices).toEqual({ Mobile: 2 });
    expect(body.data.locations).toEqual({ US: 2 });
    expect(body.data.visitsOverTime.reduce((count, day) => count + day.count, 0)).toBe(1);
    expect(body.data.urls).toHaveLength(1);
  });

  it("reports database readiness and hides outage details", async () => {
    expect((await health()).status).toBe(200);
    const ping = vi.spyOn(prisma, "$runCommandRaw").mockRejectedValueOnce(new Error("internal host"));
    try {
      const response = await health();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ status: "unavailable" });
    } finally { ping.mockRestore(); }
  });
});
