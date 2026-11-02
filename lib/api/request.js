import { ApiError } from "./errors";

export async function parseJson(request, schema) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send JSON.");
  }
  let body;
  try {
    const reader = request.body?.getReader();
    const chunks = [];
    let length = 0;
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 131072) {
            await reader.cancel();
            throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request is too large.");
          }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
    }
    body = JSON.parse(await new Blob(chunks).text());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "INVALID_JSON", "Invalid JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Check the highlighted fields.", parsed.error.flatten().fieldErrors);
  }
  return parsed.data;
}
