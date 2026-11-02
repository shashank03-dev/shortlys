import { withApiHandler, jsonOk } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/require-user";
import prisma from "@/lib/prisma";
import { serializeLinks } from "@/lib/links/metadata";

export const GET = withApiHandler(async (request) => {
  const userId = await requireUser(request);
  const urls = await prisma.url.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { qrCode: { select: { id: true, scanCount: true } } },
  });
  return jsonOk({ urls: serializeLinks(urls) });
});
