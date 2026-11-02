import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { createLink } from "@/lib/links/create-link";
import { assertContrast } from "@/lib/qr/contrast";
import { DEFAULT_STYLE } from "@/lib/qr/constants";
import { serializeQr } from "@/lib/qr/serialize";

function styleFor(input) {
  const style = { ...DEFAULT_STYLE, ...(input.style || {}) };
  try {
    assertContrast(style.fgColor, style.bgColor);
  } catch (error) {
    throw new ApiError(400, "VALIDATION_ERROR", error.message);
  }
  return style;
}

export async function createQr({ userId, input, baseUrl }) {
  const style = styleFor(input);
  const label = input.label?.trim() || null;

  if (input.mode === "existing") {
    const url = await prisma.url.findUnique({ where: { shorturl: input.shorturl } });
    if (!url || url.userId !== userId) throw new ApiError(404, "NOT_FOUND", "Short link not found.");

    const existing = await prisma.qrCode.findUnique({ where: { urlId: url.id } });
    if (existing) throw new ApiError(409, "QR_EXISTS", "This link already has a QR code.", { qrId: existing.id });

    try {
      const qr = await prisma.qrCode.create({
        data: { urlId: url.id, userId, label, ...style, createdShortLink: false },
        include: { url: true },
      });
      return serializeQr(qr, baseUrl);
    } catch (error) {
      if (error?.code === "P2002") {
        const qr = await prisma.qrCode.findUnique({ where: { urlId: url.id } });
        throw new ApiError(409, "QR_EXISTS", "This link already has a QR code.", { qrId: qr?.id });
      }
      throw error;
    }
  }

  const url = await createLink({ userId, url: input.url, alias: input.alias });
  try {
    const qr = await prisma.qrCode.create({
      data: { urlId: url.id, userId, label, ...style, createdShortLink: true },
      include: { url: true },
    });
    return serializeQr(qr, baseUrl);
  } catch (error) {
    await prisma.url.delete({ where: { id: url.id } }).catch(() => {});
    throw error;
  }
}
