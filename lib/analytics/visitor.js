const BOT = /bot|crawler|spider|preview|facebookexternalhit|slack|discord|twitterbot|linkedinbot|whatsapp/i;

function browserOf(ua) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/crios|chrome\//i.test(ua)) return "Chrome";
  if (/fxios|firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "Unknown";
}

function osOf(ua) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os|macintosh/i.test(ua)) return "MacOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
}

function deviceOf(ua) {
  if (BOT.test(ua)) return "Bot";
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function parseVisitor(request) {
  const headers = request.headers;
  const ua = headers.get("user-agent") || "";
  const country = (headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "").toUpperCase();
  const referer = headers.get("referer") || "";
  let referrer = "Direct";
  if (referer) {
    try {
      referrer = new URL(referer).hostname.slice(0, 255);
    } catch {
      referrer = "Direct";
    }
  }
  return {
    device: deviceOf(ua),
    os: osOf(ua),
    browser: browserOf(ua),
    location: /^[A-Z]{2}$/.test(country) ? country : "Unknown",
    referrer,
    isBot: BOT.test(ua),
  };
}
