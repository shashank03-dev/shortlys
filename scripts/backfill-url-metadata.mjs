import { pathToFileURL } from "node:url";
import { withDatabase } from "./maintenance-db.mjs";

export function backfillMetadata(db) {
  return db.collection("Url").updateMany({
    $or: [{ createdAt: null }, { updatedAt: null }],
  }, [{ $set: {
    createdAt: { $ifNull: ["$createdAt", { $toDate: "$_id" }] },
    updatedAt: { $ifNull: ["$updatedAt", { $ifNull: ["$createdAt", { $toDate: "$_id" }] }] },
  } }]);
}

export async function backfillReferences(db) {
  const migrate = async (name) => (await db.collection(name).updateMany({
    urlId: { $type: "string", $regex: /^[a-f0-9]{24}$/i },
  }, [{ $set: { urlId: { $toObjectId: "$urlId" } } }])).modifiedCount;
  return { visits: 0, qrCodes: await migrate("QrCode") };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await withDatabase(async (db) => {
    const metadata = await backfillMetadata(db);
    return { timestamps: metadata.modifiedCount, references: await backfillReferences(db) };
  });
}
