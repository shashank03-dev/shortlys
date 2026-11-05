"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyText, downloadPng } from "@/lib/qr/download";

export function QrCard({ qr, onDelete }) {
  const ref = useRef(null);
  const [error, setError] = useState("");

  const copy = async () => {
    try { await copyText(qr.shortUrl); }
    catch { setError("Copy failed. Copy the link manually."); }
  };

  const download = async () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    try {
      await downloadPng(svg, qr.shorturl, qr.style.size, qr.style.bgColor);
    } catch (downloadError) {
      setError(downloadError.message);
    }
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-border/60 bg-card/70 p-4">
      <div ref={ref} className="qr-paper h-fit rounded-xl p-2">
        <QRCodeSVG value={qr.qrUrl} size={84} level={qr.style.level} fgColor={qr.style.fgColor} bgColor={qr.style.bgColor} marginSize={4} boostLevel={false} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{qr.label || "Untitled QR"}</p>
            <p className="truncate text-xs text-muted-foreground">/{qr.shorturl}</p>
          </div>
          <Badge variant="primary">{qr.scanCount} scans</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{qr.destination}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          <Link href={`/qr?edit=${qr.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium hover:bg-secondary/40"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={download}><Download className="h-3.5 w-3.5" /> PNG</Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive" onClick={() => onDelete(qr)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
