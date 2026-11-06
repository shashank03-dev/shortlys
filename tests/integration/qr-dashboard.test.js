import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";

const { getAuth } = vi.hoisted(() => ({ getAuth: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ getAuth }));

const { GET } = await import("@/app/api/dashboard-data/route");

beforeEach(() => getAuth.mockReturnValue({ userId: "user_a" }));

describe("dashboard QR integration", () => {
  it("includes owned QR metadata and lifetime scan counts only", async () => {
    for (const [userId, shorturl, scanCount] of [["user_a", "my-menu", 7], ["user_b", "other-menu", 99]]) {
      await prisma.qrCode.create({
        data: {
          userId, scanCount,
          url: { create: { userId, shorturl, url: "https://example.com/menu" } },
        },
      });
    }

    const response = await GET(new Request("http://localhost/api/dashboard-data"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.urls).toHaveLength(1);
    expect(body.urls[0].qrCode).toMatchObject({ scanCount: 7 });
    expect(body.analytics.qrScans).toBe(7);
  });

  it("does not expose QR metadata without authentication", async () => {
    getAuth.mockReturnValue({ userId: null });
    expect((await GET(new Request("http://localhost/api/dashboard-data"))).status).toBe(401);
  });
});
