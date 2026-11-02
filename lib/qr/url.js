import { MAX_URL_LENGTH } from "./constants";

const PRIVATE_IPV4 = /^(0\.|127\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

export function normalizeUrl(input) {
  if (typeof input !== "string") throw new Error("Enter a URL.");
  const value = input.trim();
  if (!value) throw new Error("Enter a URL.");
  if (value.length > MAX_URL_LENGTH) throw new Error(`Maximum ${MAX_URL_LENGTH.toLocaleString()} characters.`);
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error("Remove control characters.");

  const barePort = /^[^/?#]+:\d+(?:[/?#]|$)/.test(value);
  const withScheme = !barePort && /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http and https links are supported.");
  if (parsed.username || parsed.password) throw new Error("Remove credentials from the URL.");
  if (!parsed.hostname || isPrivateHost(parsed.hostname)) throw new Error("Private and local hosts are not supported.");

  return parsed.toString();
}

export function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (PRIVATE_IPV4.test(host)) return true;
  if (!host.startsWith("[")) return false;
  const ip = host.slice(1, -1);
  if (ip === "::" || ip === "::1" || /^(fc|fd|fe[89ab])/.test(ip)) return true;
  if (ip.startsWith("::ffff:")) {
    const words = ip.slice(7).split(":");
    if (words.length === 2) {
      const high = parseInt(words[0], 16), low = parseInt(words[1], 16);
      return PRIVATE_IPV4.test(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
    }
    return PRIVATE_IPV4.test(words[0]);
  }
  return false;
}
