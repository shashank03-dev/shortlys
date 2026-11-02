import prisma from "@/lib/prisma";

export async function deleteLink(urlId, db = prisma) {
  await db.visit.deleteMany({ where: { urlId } });
  await db.qrCode.deleteMany({ where: { urlId } });
  await db.url.delete({ where: { id: urlId } });
}
