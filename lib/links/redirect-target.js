export function redirectTarget(value) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) throw new Error("Invalid destination.");
  const target = value.trim();
  const barePort = /^[^/?#]+:\d+(?:[/?#]|$)/.test(target);
  const hasScheme = !barePort && /^[a-z][a-z0-9+.-]*:/i.test(target);
  const url = new URL(hasScheme ? target : `https://${target}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid destination.");
  return url.toString();
}
