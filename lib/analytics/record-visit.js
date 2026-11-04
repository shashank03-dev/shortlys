import prisma from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function recordVisit({ urlId, visitor, source }) {
  try {
    await prisma.visit.create({
      data: {
        urlId,
        device: visitor.device,
        os: visitor.os,
        browser: visitor.browser,
        location: visitor.location,
        referrer: visitor.referrer,
        source,
      },
    });
    if (source === "qr" && !visitor.isBot) {
      // A single atomic update avoids transaction conflicts on busy QR codes.
      const result = await prisma.$runCommandRaw({
        update: "QrCode",
        updates: [{ q: { urlId: { $oid: urlId } }, u: { $inc: { scanCount: 1 }, $currentDate: { updatedAt: true } }, multi: false }],
      });
      if (result.writeErrors?.length) throw new Error("QR scan counter update failed.");
    }
  } catch (error) {
    logError("visit_record_failed", error, { urlId });
  }
}
