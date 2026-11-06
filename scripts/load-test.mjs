import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { MongoClient } from "mongodb";
import { testEnvironment } from "./test-env.mjs";

const env = { ...process.env, ...testEnvironment("e2e"), NEXT_DIST_DIR: ".next-test" };
const base = "http://localhost:3100";
const concurrency = Number(process.env.LOAD_CONCURRENCY || 50);
const seconds = Number(process.env.LOAD_SECONDS || 120);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 200 || !Number.isFinite(seconds) || seconds < 1 || seconds > 600) {
  throw new Error("Use 1–200 workers and a duration of 1–600 seconds.");
}
const client = new MongoClient(env.DATABASE_URL);
const alias = `load-${Date.now().toString(36)}`;
let server;
let urlId;

function command(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Command exited ${code}`)));
  });
}

try {
  await command(["node_modules/next/dist/bin/next", "build"]);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3100"], { env, stdio: "inherit" });
  server.on("error", (error) => console.error(error.message));
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Local load server failed to start.");
    try { ready = (await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Local load server is not ready.");
  const db = (await client.connect()).db();
  const { ObjectId } = await import("mongodb");
  urlId = new ObjectId();
  await db.collection("Url").insertOne({ _id: urlId, shorturl: alias, url: "https://example.com/load", userId: "local_load", createdAt: new Date(), updatedAt: new Date() });
  await db.collection("QrCode").insertOne({ _id: new ObjectId(), urlId, userId: "local_load", scanCount: 0, createdShortLink: true, fgColor: "#111827", bgColor: "#FFFFFF", level: "M", size: 1024, createdAt: new Date(), updatedAt: new Date() });
  const latencies = [];
  let errors = 0;
  const deadline = Date.now() + seconds * 1000;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (Date.now() < deadline) {
      const start = performance.now();
      try {
        const response = await fetch(`${base}/${alias}?src=qr`, { redirect: "manual", signal: AbortSignal.timeout(10000), headers: { "user-agent": "Mozilla/5.0 Chrome/140.0" } });
        if (response.status !== 307 || response.headers.get("location") !== "https://example.com/load") errors += 1;
        await response.arrayBuffer();
      } catch { errors += 1; }
      latencies.push(performance.now() - start);
    }
  }));
  latencies.sort((a, b) => a - b);
  const percentile = (p) => Math.round(latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] * 100) / 100;
  let visits = 0, scans = 0;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    visits = await db.collection("Visit").countDocuments({ urlId: urlId.toHexString(), source: "qr" });
    scans = (await db.collection("QrCode").findOne({ urlId })).scanCount;
    if (visits === latencies.length && scans === latencies.length) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const report = { localOnly: true, seconds, concurrency, requests: latencies.length, errors, visits, scans, p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) };
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/load.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (errors || visits !== latencies.length || scans !== latencies.length || report.p95 >= 150 || report.p99 >= 400) process.exitCode = 1;
} finally {
  if (server) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.exitCode !== null ? resolve() : server.once("exit", resolve));
  }
  if (urlId) {
    const db = client.db();
    await db.collection("Visit").deleteMany({ urlId: urlId.toHexString() });
    await db.collection("QrCode").deleteMany({ urlId });
    await db.collection("Url").deleteOne({ _id: urlId });
  }
  await client.close();
}
