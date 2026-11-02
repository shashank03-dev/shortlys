import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { deleteLink } from "@/lib/links/delete-link";
import { isObjectId } from "@/lib/qr/id";

export async function deleteQr({ userId, id }) {
  if (!isObjectId(id)) throw new ApiError(404, "NOT_FOUND", "QR code not found.");
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findFirst({ where: { id, userId } });
    if (!qr) throw new ApiError(404, "NOT_FOUND", "QR code not found.");
    await tx.qrCode.delete({ where: { id } });
    if (qr.createdShortLink) await deleteLink(qr.urlId, tx);
    return { id };
  });
}
