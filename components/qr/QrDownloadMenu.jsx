"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QR_SIZES } from "@/lib/qr/constants";
import { downloadPng, downloadSvg } from "@/lib/qr/download";

export function QrDownloadMenu({ containerRef, shorturl, size, onSizeChange, background, onError }) {
  const [busy, setBusy] = useState(false);

  const run = async (format) => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      if (format === "svg") downloadSvg(svg, shorturl, size);
      else await downloadPng(svg, shorturl, size, background);
    } catch (error) {
      onError?.(error.message || "Download failed. Try the other format.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="PNG size"
        value={size}
        onChange={(event) => onSizeChange(Number(event.target.value))}
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      >
        {QR_SIZES.map((value) => <option key={value} value={value}>{value}px</option>)}
      </select>
      <Button variant="outline" size="sm" onClick={() => run("png")} disabled={busy}>
        <Download className="h-4 w-4" /> PNG
      </Button>
      <Button variant="outline" size="sm" onClick={() => run("svg")} disabled={busy}>
        <Download className="h-4 w-4" /> SVG
      </Button>
    </div>
  );
}
