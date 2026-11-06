import { MongoClient, ObjectId } from "mongodb";
import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { backfillMetadata, backfillReferences } from "../../scripts/backfill-url-metadata.mjs";
import { reconcileCounts } from "../../scripts/reconcile-qr-counts.mjs";

const client = new MongoClient(process.env.DATABASE_URL);
afterAll(() => client.close());

describe("maintenance operations", () => {
  it("backfills missing dates from ObjectIds without changing existing dates", async () => {
    const db = (await client.connect()).db();
    const id = new ObjectId("650000000000000000000001");
    const keep = new Date("2025-01-01T00:00:00Z");
    await db.collection("Url").insertMany([
      { _id: id, url: "https://example.com", shorturl: "legacy", userId: "ops" },
      { _id: new ObjectId(), url: "https://example.com", shorturl: "dated", userId: "ops", createdAt: keep, updatedAt: keep },
    ]);
    expect((await backfillMetadata(db)).modifiedCount).toBe(1);
    const legacy = await db.collection("Url").findOne({ _id: id });
    expect(legacy.createdAt.toISOString()).toBe("2023-09-12T06:06:56.000Z");
    expect(legacy.updatedAt).toEqual(legacy.createdAt);
    expect((await db.collection("Url").findOne({ shorturl: "dated" })).createdAt).toEqual(keep);
    expect((await backfillMetadata(db)).modifiedCount).toBe(0);
  });

  it("reconciles QR counts from QR visits without counting direct visits", async () => {
    const db = (await client.connect()).db();
    const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "reconcile", userId: "ops" } });
    const qr = await prisma.qrCode.create({ data: { urlId: url.id, userId: "ops", scanCount: 99 } });
    await prisma.visit.createMany({ data: ["qr", "qr", null].map((source) => ({
      urlId: url.id, source, device: "Desktop", os: "Linux", browser: "Firefox", location: "Unknown",
    })) });
    await reconcileCounts(db);
    expect((await prisma.qrCode.findUnique({ where: { id: qr.id } })).scanCount).toBe(2);
    expect((await reconcileCounts(db)).modifiedCount).toBe(0);
  });

  it("migrates prototype QR references while preserving legacy visit references", async () => {
    const db = (await client.connect()).db();
    const url = await prisma.url.create({ data: { url: "https://example.com", shorturl: "legacy-refs", userId: "ops" } });
    const qr = await prisma.qrCode.create({ data: { urlId: url.id, userId: "ops" } });
    const visit = await prisma.visit.create({ data: { urlId: url.id, device: "Desktop", browser: "Firefox", os: "Linux", location: "Unknown" } });
    await db.collection("QrCode").updateOne({ _id: new ObjectId(qr.id) }, { $set: { urlId: url.id } });
    await db.collection("Visit").updateOne({ _id: visit.id }, { $set: { urlId: url.id } });
    expect(await backfillReferences(db)).toEqual({ visits: 0, qrCodes: 1 });
    expect((await db.collection("Visit").findOne({ _id: visit.id })).urlId).toBe(url.id);
    expect((await prisma.url.findUnique({ where: { id: url.id }, include: { visits: true, qrCode: true } })).visits).toHaveLength(1);
    expect(await backfillReferences(db)).toEqual({ visits: 0, qrCodes: 0 });
  });
});
