const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value) {
  return typeof value === "string" && HEX.test(value);
}

function channel(value) {
  const n = parseInt(value, 16) / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

export function getContrastRatio(foreground, background) {
  if (!isHexColor(foreground) || !isHexColor(background)) throw new Error("Use 6-digit hex colors.");
  const fg = 0.2126 * channel(foreground.slice(1, 3)) + 0.7152 * channel(foreground.slice(3, 5)) + 0.0722 * channel(foreground.slice(5, 7));
  const bg = 0.2126 * channel(background.slice(1, 3)) + 0.7152 * channel(background.slice(3, 5)) + 0.0722 * channel(background.slice(5, 7));
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

export function assertContrast(foreground, background) {
  if (getContrastRatio(foreground, background) < 4.5) {
    throw new Error("Increase foreground/background contrast.");
  }
}
