"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Pencil, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText, shareQr } from "@/lib/qr/download";
import { QrDownloadMenu } from "./QrDownloadMenu";
import { QrPreview } from "./QrPreview";

export function QrResult({ qr, onReset, editHref }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState(qr.style.size);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  };

  const copy = async () => {
    try {
      await copyText(qr.shortUrl);
      flash("Copied");
    } catch { setError("Copy failed. Copy the link manually."); }
  };

  const share = async () => {
    try {
      const result = await shareQr({ title: "Shortlys QR code", text: qr.shortUrl, url: qr.shortUrl });
      if (result === "copied") flash("Copied");
    } catch (error) {
      if (error.name !== "AbortError") setError("Share failed.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <QrPreview value={qr.qrUrl} style={qr.style} size={224} caption={qr.shortUrl} containerRef={containerRef} />

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">QR code ready</p>
          <a href={qr.shortUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 break-all text-lg font-semibold text-primary hover:underline">
            {qr.shortUrl} <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </div>

        <QrDownloadMenu
          containerRef={containerRef}
          shorturl={qr.shorturl}
          size={size}
          onSizeChange={setSize}
          background={qr.style.bgColor}
          onError={setError}
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copy}><Copy className="h-4 w-4" /> Copy</Button>
          <Button variant="outline" size="sm" onClick={share}><Share2 className="h-4 w-4" /> Share</Button>
          {editHref ? <Link href={editHref} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium hover:bg-secondary/30"><Pencil className="h-4 w-4" /> Edit</Link> : null}
          <Button variant="ghost" size="sm" onClick={onReset}><Plus className="h-4 w-4" /> Create another</Button>
        </div>

        {notice ? <p className="flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" /> {notice}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
