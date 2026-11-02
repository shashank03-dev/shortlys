import { withApiHandler, jsonOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/request";
import { requireUser } from "@/lib/auth/require-user";
import { getBaseUrl } from "@/lib/site";
import { createQrSchema } from "@/lib/qr/schemas";
import { createQr } from "@/lib/qr/create-qr";
import { listQr } from "@/lib/qr/list-qr";
import { enforceQrLimits } from "@/lib/rate-limit";
import { rateLimitHeaders } from "@/lib/api/rate-headers";

export const POST = withApiHandler(async (request) => {
  const userId = await requireUser(request);
  const limits = await enforceQrLimits(userId);
  const input = await parseJson(request, createQrSchema);
  const qr = await createQr({ userId, input, baseUrl: getBaseUrl(request) });
  return jsonOk({ data: qr }, { status: 201, headers: rateLimitHeaders(limits) });
});

export const GET = withApiHandler(async (request) => {
  const userId = await requireUser(request);
  const params = new URL(request.url).searchParams;
  const limit = Math.min(50, Math.max(1, Math.floor(Number(params.get("limit"))) || 12));
  const result = await listQr({
    userId,
    cursor: params.get("cursor") || undefined,
    limit,
    baseUrl: getBaseUrl(request),
  });
  return jsonOk({ data: result });
});
