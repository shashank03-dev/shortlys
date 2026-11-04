import { MongoClient, ObjectId } from "mongodb";
import { afterAll, beforeEach, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";

const { getAuth, jobs } = vi.hoisted(() => ({ getAuth: vi.fn(), jobs: [] }));
vi.mock("@clerk/nextjs/server", () => ({ getAuth }));
vi.mock("next/server", async (original) => ({ ...(await original()), after: (callback) => jobs.push(callback()) }));
const { GET: dashboard } = await import("@/app/api/dashboard-data/route");
const { GET: userUrls } = await import("@/app/api/user-urls/route");
const { GET: redirect } = await import("@/app/[shorturl]/route");
const client = new MongoClient(process.env.DATABASE_URL);
afterAll(() => client.close());
beforeEach(() => { getAuth.mockReturnValue({ userId: "legacy_user" }); jobs.length = 0; });

async function seedLegacy({ timestamps = false } = {}) {
  const db = (await client.connect()).db();
  const id = new ObjectId("650000000000000000000001");
  await db.collection("Url").insertOne({ _id: id, userId: "legacy_user", shorturl: "Old_Link", url: "example.com/legacy?x=1",
    ...(timestamps ? { createdAt: new Date(), updatedAt: new Date() } : {}),
  });
  await db.collection("Visit").insertOne({ _id: "legacy-visit", urlId: id.toHexString(), device: "Mobile", os: "iOS", browser: "Safari", location: "US", createdAt: new Date() });
  return { db, id };
}

it("reads original links without timestamp backfill", async () => {
  await seedLegacy();
  const response = await userUrls(new Request("http://localhost/api/user-urls"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.urls[0].shorturl).toBe("Old_Link");
  expect(body.urls[0].createdAt).toBe("2023-09-12T06:06:56.000Z");
});

it("keeps legacy string-referenced visits visible without converting data", async () => {
  const { db } = await seedLegacy({ timestamps: true });
  const response = await dashboard(new Request("http://localhost/api/dashboard-data"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.analytics.visits).toHaveLength(1);
  expect((await db.collection("Visit").findOne({ _id: "legacy-visit" })).urlId).toBe("650000000000000000000001");
});

it("preserves existing aliases and writes visits readable by the previous application", async () => {
  const { db, id } = await seedLegacy();
  const response = await redirect(new Request("http://localhost/Old_Link", { headers: { "user-agent": "Mozilla/5.0 Chrome/140.0" } }), { params: Promise.resolve({ shorturl: "Old_Link" }) });
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://example.com/legacy?x=1");
  await Promise.all(jobs);
  expect(await db.collection("Visit").countDocuments({ urlId: id.toHexString() })).toBe(2);
  expect(await prisma.visit.count({ where: { urlId: id.toHexString() } })).toBe(2);
});

it("preserves valid HTTP destinations saved before the new creation policy", async () => {
  const { db, id } = await seedLegacy();
  for (const target of ["http://127.0.0.1:8080/service", "https://user:pass@example.com/private"]) {
    await db.collection("Url").updateOne({ _id: id }, { $set: { url: target } });
    const response = await redirect(new Request("http://localhost/Old_Link"), { params: Promise.resolve({ shorturl: "Old_Link" }) });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(target);
  }
  await Promise.all(jobs);
});
