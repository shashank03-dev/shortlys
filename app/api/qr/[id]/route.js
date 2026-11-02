import { withApiHandler, jsonOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/request";
import { requireUser } from "@/lib/auth/require-user";
import { getBaseUrl } from "@/lib/site";
import { updateQrSchema } from "@/lib/qr/schemas";
import { updateQr } from "@/lib/qr/update-qr";
import { deleteQr } from "@/lib/qr/delete-qr";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { serializeQr } from "@/lib/qr/serialize";
import { isObjectId } from "@/lib/qr/id";
import { enforceMutationLimits } from "@/lib/rate-limit";

export const GET = withApiHandler(async (request, { params }) => {
  const userId = await requireUser(request);
  const { id } = await params;
  if (!isObjectId(id)) throw new ApiError(404, "NOT_FOUND", "QR code not found.");
  const qr = await prisma.qrCode.findFirst({ where: { id, userId }, include: { url: true } });
  if (!qr) throw new ApiError(404, "NOT_FOUND", "QR code not found.");
  return jsonOk({ data: serializeQr(qr, getBaseUrl(request)) });
});

export const PATCH = withApiHandler(async (request, { params }) => {
  const userId = await requireUser(request);
  await enforceMutationLimits(userId);
  const { id } = await params;
  const input = await parseJson(request, updateQrSchema);
  const qr = await updateQr({ userId, id, input, baseUrl: getBaseUrl(request) });
  return jsonOk({ data: qr });
});

export const DELETE = withApiHandler(async (request, { params }) => {
  const userId = await requireUser(request);
  await enforceMutationLimits(userId);
  const { id } = await params;
  const result = await deleteQr({ userId, id });
  return jsonOk({ data: result });
});
