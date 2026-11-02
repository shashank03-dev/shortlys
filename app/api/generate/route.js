import { withApiHandler, jsonOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/request";
import { requireUser } from "@/lib/auth/require-user";
import { createLink } from "@/lib/links/create-link";
import { generateSchema } from "@/lib/qr/schemas";
import { enforceGenerateLimits } from "@/lib/rate-limit";
import { rateLimitHeaders } from "@/lib/api/rate-headers";

export const POST = withApiHandler(async (request) => {
  const userId = await requireUser(request);
  const limits = await enforceGenerateLimits(userId);
  const input = await parseJson(request, generateSchema);
  const link = await createLink({ userId, url: input.url, alias: input.shorturl });
  return jsonOk({
    message: "URL Generated Successfully",
    shorturl: link.shorturl,
    url: link.url,
    data: { shorturl: link.shorturl, url: link.url },
  }, { headers: rateLimitHeaders(limits) });
});
