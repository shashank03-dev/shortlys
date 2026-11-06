function trimBase(value) {
  return value ? value.replace(/\/+$/, "") : "";
}

export function getBaseUrl(request) {
  const configured = trimBase(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (request?.url) return new URL(request.url).origin;
  return "http://localhost:3000";
}

export function shortUrl(baseUrl, shorturl) {
  return `${trimBase(baseUrl)}/${shorturl}`;
}

export function qrUrl(baseUrl, shorturl) {
  return `${shortUrl(baseUrl, shorturl)}?src=qr`;
}
