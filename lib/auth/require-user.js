import { getAuth } from "@clerk/nextjs/server";
import { ApiError } from "@/lib/api/errors";

export async function requireUser(request) {
  const { userId } = getAuth(request);
  if (!userId) throw new ApiError(401, "AUTH_REQUIRED", "Sign in to save your QR code.");
  return userId;
}
