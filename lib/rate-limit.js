import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { logError } from "@/lib/logger";
import { randomUUID } from "node:crypto";

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function limitsDisabled() {
  return process.env.RATE_LIMIT_DISABLED === "true" && process.env.VERCEL_ENV !== "production" &&
    (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview");
}

export async function checkRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);
  const scopedKey = `${key}:${windowStart.getTime()}`;

  try {
    if (Math.random() < 0.01) {
      prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }).catch(() => {});
    }
    // Increment and read the bucket in one atomic MongoDB operation.
    const result = await prisma.$runCommandRaw({
      findAndModify: "RateLimit",
      query: { key: scopedKey },
      update: {
        $inc: { count: 1 },
        $setOnInsert: { _id: randomUUID(), windowStart: { $date: windowStart.toISOString() }, expiresAt: { $date: expiresAt.toISOString() } },
      },
      upsert: true,
      new: true,
    });
    const record = result.value;
    if (!Number.isFinite(record?.count)) throw new Error("Rate-limit counter unavailable.");
    return {
      allowed: record.count <= limit,
      limit,
      remaining: Math.max(0, limit - record.count),
      reset: Math.ceil(expiresAt.getTime() / 1000),
      retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
    };
  } catch (error) {
    logError("rate_limit.error", error, { key });
    return { allowed: true, limit, remaining: limit, reset: Math.ceil(expiresAt.getTime() / 1000), retryAfter: 0 };
  }
}

async function enforce({ key, minuteLimit, hourLimit }) {
  if (limitsDisabled()) {
    return { limit: minuteLimit, remaining: minuteLimit, reset: Math.ceil(Date.now() / 1000) + 60 };
  }
  const minute = await checkRateLimit({ key: `${key}:minute`, limit: minuteLimit, windowMs: 60_000 });
  if (!minute.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Try again shortly.", { retryAfter: minute.retryAfter });
  const hour = await checkRateLimit({ key: `${key}:hour`, limit: hourLimit, windowMs: 3_600_000 });
  if (!hour.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Try again shortly.", { retryAfter: hour.retryAfter });
  return {
    limit: minuteLimit,
    remaining: Math.min(minute.remaining, hour.remaining),
    reset: minute.reset,
  };
}

export function enforceQrLimits(userId) {
  return enforce({
    key: `qr:${userId}`,
    minuteLimit: numberFromEnv("RATE_LIMIT_QR_PER_MINUTE", 10),
    hourLimit: numberFromEnv("RATE_LIMIT_QR_PER_HOUR", 60),
  });
}

export async function enforceMutationLimits(userId) {
  if (limitsDisabled()) return;
  const result = await checkRateLimit({ key: `qr-mutate:${userId}`, limit: numberFromEnv("RATE_LIMIT_MUTATIONS_PER_HOUR", 60), windowMs: 3_600_000 });
  if (!result.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many changes. Try again shortly.", { retryAfter: result.retryAfter });
}
