import { NextResponse, after } from "next/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { parseVisitor } from "@/lib/analytics/visitor";
import { recordVisit } from "@/lib/analytics/record-visit";
import { logError } from "@/lib/logger";
import { redirectTarget } from "@/lib/links/redirect-target";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectHeaders(target) {
  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export async function GET(request, { params }) {
  const { shorturl } = await params;
  let clean = shorturl;
  try {
    clean = decodeURIComponent(shorturl).replace(/\/+$/, "");
  } catch {
    notFound();
  }
  if (!clean || clean.length > 64) notFound();

  let entry;
  try {
    entry = await prisma.url.findUnique({
      where: { shorturl: clean },
      select: { id: true, url: true },
    });
  } catch (error) {
    logError("redirect.lookup_failed", error, { shorturl: clean });
    return new NextResponse("Service unavailable.", {
      status: 503,
      headers: { "Retry-After": "30", "Cache-Control": "no-store" },
    });
  }
  if (!entry) notFound();

  let target;
  try {
    target = redirectTarget(entry.url);
  } catch {
    return new NextResponse("Service unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const visitor = parseVisitor(request);
  if (request.method !== "HEAD" && !visitor.isBot) {
    const source = new URL(request.url).searchParams.get("src") === "qr" ? "qr" : null;
    after(() => recordVisit({ urlId: entry.id, visitor, source }));
  }

  return redirectHeaders(target);
}
