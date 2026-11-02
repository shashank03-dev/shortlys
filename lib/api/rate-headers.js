export function rateLimitHeaders(limits) {
  if (!limits) return undefined;
  return {
    "X-RateLimit-Limit": String(limits.limit),
    "X-RateLimit-Remaining": String(limits.remaining),
    "X-RateLimit-Reset": String(limits.reset),
  };
}
