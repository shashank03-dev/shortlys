import { pathToFileURL } from "node:url";
import { withDatabase } from "./maintenance-db.mjs";

export async function reconcileCounts(db) {
  const qrCodes = db.collection("QrCode");
  let modifiedCount = 0;
  for await (const qr of qrCodes.find({}, { projection: { urlId: 1, scanCount: 1 } })) {
    const urlId = qr.urlId.toHexString?.() || qr.urlId;
    const count = await db.collection("Visit").countDocuments({ urlId, source: "qr" });
    const result = await qrCodes.updateOne({ _id: qr._id, scanCount: qr.scanCount }, { $set: { scanCount: count } });
    modifiedCount += result.modifiedCount;
  }
  return { modifiedCount };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await withDatabase(reconcileCounts);
}
