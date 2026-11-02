import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { normalizeUrl } from "@/lib/qr/url";
import { generateAlias, normalizeAlias } from "@/lib/qr/alias";

export async function createLink({ userId, url, alias }) {
  let destination;
  try {
    destination = normalizeUrl(url);
  } catch (error) {
    throw new ApiError(400, "VALIDATION_ERROR", error.message);
  }

  let customAlias = null;
  if (alias) {
    try {
      customAlias = normalizeAlias(alias);
    } catch (error) {
      throw new ApiError(400, "VALIDATION_ERROR", error.message);
    }
  }
  let candidate = customAlias || generateAlias();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await prisma.url.create({
        data: { url: destination, shorturl: candidate, userId },
      });
    } catch (error) {
      if (error?.code !== "P2002") throw error;
      if (customAlias) throw new ApiError(409, "ALIAS_TAKEN", "That alias is taken.");
      candidate = generateAlias();
    }
  }

  throw new ApiError(503, "ALIAS_UNAVAILABLE", "Could not create a short link. Try again.");
}
