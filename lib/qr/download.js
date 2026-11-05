export function serializeSvg(svg, size) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (size) {
    clone.setAttribute("width", String(size));
    clone.setAttribute("height", String(size));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export function filenameFor(shorturl, extension) {
  const safe = String(shorturl || "qr").replace(/[^a-z0-9_-]/gi, "");
  return `shortlys-${safe}.${extension}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadSvg(svg, shorturl, size) {
  const blob = new Blob([serializeSvg(svg, size)], { type: "image/svg+xml" });
  downloadBlob(blob, filenameFor(shorturl, "svg"));
}

export function downloadPng(svg, shorturl, size, background = "#FFFFFF") {
  const source = serializeSvg(svg, size);
  const blob = new Blob([source], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);
        canvas.toBlob((png) => {
          if (!png) return reject(new Error("PNG export failed. Try SVG or a smaller size."));
          try {
            downloadBlob(png, filenameFor(shorturl, "png"));
            resolve();
          } catch (error) { reject(error); }
        }, "image/png");
      } catch {
        reject(new Error("PNG export failed. Try SVG or a smaller size."));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("PNG export failed."));
    };
    image.src = url;
  });
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  try {
    if (!document.execCommand("copy")) throw new Error("Copy failed. Copy the link manually.");
  } finally { input.remove(); }
}

export async function shareQr({ title, text, url }) {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }
  await copyText(url);
  return "copied";
}
