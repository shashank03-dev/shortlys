import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { serializeQr } from "@/lib/qr/serialize";
import { isObjectId } from "@/lib/qr/id";

export async function listQr({ userId, cursor, limit = 12, baseUrl }) {
  if (cursor && !isObjectId(cursor)) throw new ApiError(400, "VALIDATION_ERROR", "Invalid cursor.");
  const rows = await prisma.qrCode.findMany({
    where: { userId, ...(cursor ? { id: { lt: cursor } } : {}) },
    include: { url: true },
    orderBy: { id: "desc" },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((qr) => serializeQr(qr, baseUrl));
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}
