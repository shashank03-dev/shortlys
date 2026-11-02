import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { normalizeUrl } from "@/lib/qr/url";
import { assertContrast } from "@/lib/qr/contrast";
import { serializeQr } from "@/lib/qr/serialize";
import { isObjectId } from "@/lib/qr/id";

export async function updateQr({ userId, id, input, baseUrl }) {
  if (!isObjectId(id)) throw new ApiError(404, "NOT_FOUND", "QR code not found.");
  const existing = await prisma.qrCode.findFirst({ where: { id, userId }, include: { url: true } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "QR code not found.");

  let destination;
  if (input.url) {
    try {
      destination = normalizeUrl(input.url);
    } catch (error) {
      throw new ApiError(400, "VALIDATION_ERROR", error.message);
    }
  }

  const data = {};
  if (input.label !== undefined) data.label = input.label?.trim() || null;
  if (input.style) {
    const style = { ...existing, ...input.style };
    try {
      assertContrast(style.fgColor, style.bgColor);
    } catch (error) {
      throw new ApiError(400, "VALIDATION_ERROR", error.message);
    }
    Object.assign(data, {
      fgColor: style.fgColor,
      bgColor: style.bgColor,
      level: style.level,
      size: style.size,
    });
  }

  if (destination) data.url = { update: { url: destination } };
  const qr = await prisma.qrCode.update({ where: { id }, data, include: { url: true } });
  return serializeQr(qr, baseUrl);
}
