export const QR_SIZES = [512, 1024, 2048, 4096];
export const QR_LEVELS = ["M", "Q", "H"];
export const MAX_URL_LENGTH = 16384;
export const MAX_LABEL_LENGTH = 80;
export const ALIAS_MIN = 3;
export const ALIAS_MAX = 32;
export const ALIAS_PATTERN = /^[a-z0-9_-]+$/;
export const QR_SOURCE = "qr";
export const PAGE_SIZE = 12;

export const DEFAULT_STYLE = {
  fgColor: "#111827",
  bgColor: "#FFFFFF",
  level: "M",
  size: 1024,
};

export const QR_PRESETS = [
  { id: "classic", label: "Classic", fgColor: "#111827", bgColor: "#FFFFFF" },
  { id: "ink", label: "Ink", fgColor: "#1E3A8A", bgColor: "#F8FAFC" },
  { id: "sage", label: "Sage", fgColor: "#14532D", bgColor: "#F0FDF4" },
];

export const RESERVED_ALIASES = new Set([
  "api",
  "dashboard",
  "qr",
  "shorten",
  "sign-in",
  "sign-up",
  "404",
  "not-found",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);
