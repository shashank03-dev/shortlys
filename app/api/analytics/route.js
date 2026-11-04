import { withApiHandler, jsonOk } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/require-user";
import { serializeLinks } from "@/lib/links/metadata";
import prisma from "@/lib/prisma";

export const GET = withApiHandler(async (request) => {
  const userId = await requireUser(request);
  const urls = serializeLinks(await prisma.url.findMany({
    where: { userId },
    select: { id: true, shorturl: true, url: true, createdAt: true },
  }));
  if (!urls.length) return jsonOk({ data: { totalVisits: 0, devices: {}, locations: {}, visitsOverTime: [], urls: [] } });

  const where = { urlId: { in: urls.map((url) => url.id) } };
  const days = Array.from({ length: 7 }, (_, index) => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (6 - index));
    return start;
  });
  const [totalVisits, devices, locations, dailyCounts] = await Promise.all([
    prisma.visit.count({ where }),
    prisma.visit.groupBy({ by: ["device"], where, _count: { _all: true } }),
    prisma.visit.groupBy({ by: ["location"], where, _count: { _all: true } }),
    Promise.all(days.map((start) => prisma.visit.count({ where: {
      ...where, createdAt: { gte: start, lt: new Date(start.getTime() + 86_400_000) },
    } }))),
  ]);
  const counts = (rows, field) => Object.fromEntries(rows.map((row) => [row[field] || "Unknown", row._count._all]));
  return jsonOk({ data: {
    totalVisits,
    devices: counts(devices, "device"),
    locations: counts(locations, "location"),
    visitsOverTime: days.map((day, index) => ({ date: day.toISOString().slice(0, 10), count: dailyCounts[index] })),
    urls,
  } });
});
