import { qrUrl, shortUrl } from "@/lib/site";

export function serializeQr(qr, baseUrl) {
  return {
    id: qr.id,
    label: qr.label,
    shorturl: qr.url.shorturl,
    destination: qr.url.url,
    shortUrl: shortUrl(baseUrl, qr.url.shorturl),
    qrUrl: qrUrl(baseUrl, qr.url.shorturl),
    style: {
      fgColor: qr.fgColor,
      bgColor: qr.bgColor,
      level: qr.level,
      size: qr.size,
    },
    scanCount: qr.scanCount,
    createdShortLink: qr.createdShortLink,
    createdAt: qr.createdAt,
    updatedAt: qr.updatedAt,
  };
}
