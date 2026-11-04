import { expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { recordVisit } from "@/lib/analytics/record-visit";

it("preserves all visits and counter increments during a 500-scan burst", async () => {
  const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "scan-contention", userId: "load" } });
  await prisma.qrCode.create({ data: { urlId: url.id, userId: "load" } });
  const logging = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    await Promise.all(Array.from({ length: 500 }, () => recordVisit({
      urlId: url.id, source: "qr",
      visitor: { device: "Desktop", os: "Linux", browser: "Firefox", location: "US", referrer: "Direct", isBot: false },
    })));
    expect(await prisma.visit.count({ where: { urlId: url.id } })).toBe(500);
    expect((await prisma.qrCode.findUnique({ where: { urlId: url.id } })).scanCount).toBe(500);
  } finally { logging.mockRestore(); }
});
