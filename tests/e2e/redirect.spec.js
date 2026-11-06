import { test, expect } from "@playwright/test";
import prisma from "../../lib/prisma.js";

let alias;

test.beforeAll(async () => {
  alias = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const url = await prisma.url.create({ data: { url: "https://example.com/e2e-destination", shorturl: alias, userId: "e2e_user" } });
  await prisma.qrCode.create({ data: { urlId: url.id, userId: "e2e_user", fgColor: "#111827", bgColor: "#FFFFFF" } });
});

test.afterAll(async () => {
  const url = await prisma.url.findUnique({ where: { shorturl: alias } });
  if (url) {
    await prisma.visit.deleteMany({ where: { urlId: url.id } });
    await prisma.qrCode.deleteMany({ where: { urlId: url.id } });
    await prisma.url.delete({ where: { id: url.id } });
  }
  await prisma.$disconnect();
});

test("QR redirect is fast and records the source", async ({ request }) => {
  const response = await request.get(`/${alias}?src=qr`, { maxRedirects: 0, headers: { "user-agent": "Mozilla/5.0 Chrome/120", "x-vercel-ip-country": "US" } });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("https://example.com/e2e-destination");

  await expect.poll(async () => {
    const visit = await prisma.visit.findFirst({ where: { urlId: (await prisma.url.findUnique({ where: { shorturl: alias } })).id } });
    return visit?.source;
  }, { timeout: 5000 }).toBe("qr");
});

test("100 concurrent scans are all recorded and HEAD and bots add none", async ({ request }) => {
  const url = await prisma.url.findUnique({ where: { shorturl: alias } });
  const baseline = await prisma.visit.count({ where: { urlId: url.id } });
  const responses = await Promise.all(Array.from({ length: 100 }, () => request.get(`/${alias}?src=qr`, {
    maxRedirects: 0, headers: { "user-agent": "Mozilla/5.0 Chrome/140.0" },
  })));
  expect(responses.every((response) => response.status() === 307 && response.headers().location === "https://example.com/e2e-destination")).toBe(true);
  await request.head(`/${alias}?src=qr`, { maxRedirects: 0 });
  await request.get(`/${alias}?src=qr`, { maxRedirects: 0, headers: { "user-agent": "Googlebot" } });
  await expect.poll(() => prisma.visit.count({ where: { urlId: url.id } }), { timeout: 10000 }).toBe(baseline + 100);
});
