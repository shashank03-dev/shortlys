import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk(data, init) {
  return NextResponse.json({ success: true, ...data }, init);
}

export function jsonError(error) {
  if (["P1001", "P1002", "P1008", "P1017", "P2024", "P2037"].includes(error?.code) || error?.name === "PrismaClientInitializationError") {
    error = new ApiError(503, "SERVICE_UNAVAILABLE", "Service unavailable. Try again shortly.");
  }
  const status = error instanceof ApiError ? error.status : 500;
  const code = error instanceof ApiError ? error.code : "INTERNAL_ERROR";
  const message = error instanceof ApiError ? error.message : "Something went wrong.";
  const headers = error?.details?.retryAfter ? { "Retry-After": String(error.details.retryAfter) } : undefined;
  return NextResponse.json(
    { success: false, error: { code, message, details: error instanceof ApiError ? error.details : undefined }, message },
    { status, headers },
  );
}

export function withApiHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (!(error instanceof ApiError)) console.error(error);
      return jsonError(error);
    }
  };
}
