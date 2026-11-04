import { withApiHandler, jsonOk } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/require-user";
import prisma from "@/lib/prisma";
import { serializeLinks } from "@/lib/links/metadata";

export const GET = withApiHandler(async (request) => {
  const userId = await requireUser(request);
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const urls = await prisma.url.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      shorturl: true,
      createdAt: true,
      qrCode: { select: { id: true, scanCount: true, label: true } },
    },
  });

  const visitFilter = { urlId: { in: urls.map((url) => url.id) } };
  const [rows, totals] = await Promise.all([prisma.visit.findMany({
    where: { urlId: { in: urls.map((url) => url.id) }, createdAt: { gte: since } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 5001,
    select: { id: true, urlId: true, device: true, os: true, browser: true, location: true, source: true, createdAt: true },
  }), prisma.visit.groupBy({ by: ["urlId"], where: visitFilter, _count: { _all: true } })]);
  const visitCounts = new Map(totals.map((row) => [row.urlId, row._count._all]));
  const aliases = new Map(urls.map((url) => [url.id, url.shorturl]));
  const visits = rows.slice(0, 5000).map((visit) => ({ ...visit, shorturl: aliases.get(visit.urlId) }));
  const grouped = new Map();
  for (const visit of visits) {
    if (!grouped.has(visit.urlId)) grouped.set(visit.urlId, []);
    grouped.get(visit.urlId).push(visit);
  }
  const qrScans = visits.filter((visit) => visit.source === "qr").length;
  const count = (field) => visits.reduce((acc, visit) => {
    const key = visit[field] || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return jsonOk({
    urls: serializeLinks(urls).map((url) => ({ ...url, visits: grouped.get(url.id) || [], visitCount: visitCounts.get(url.id) || 0 })),
    analytics: {
      visits,
      deviceStats: count("device"),
      osStats: count("os"),
      browserStats: count("browser"),
      locationStats: count("location"),
      qrScans,
      truncated: rows.length > 5000,
      totalVisits: totals.reduce((total, row) => total + row._count._all, 0),
    },
  });
});
