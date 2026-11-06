import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function QrFeatureSection() {
  const sample = `${process.env.NEXT_PUBLIC_APP_URL || "https://shortlys.com"}/qr`;
  return (
    <section id="qr" className="container mx-auto px-6 py-24">
      <div className="grid items-center gap-10 rounded-3xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl md:grid-cols-2 md:p-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">QR codes</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">QR codes that stay editable.</h2>
          <p className="mt-3 text-muted-foreground">We shorten first, then encode. Printed codes keep working.</p>
          <Link href="/qr" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
            Create a QR code <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="qr-paper mx-auto w-fit rounded-2xl p-5" aria-hidden="true">
          <QRCodeSVG value={sample} size={180} level="M" fgColor="#111827" bgColor="#FFFFFF" marginSize={4} boostLevel={false} />
        </div>
      </div>
    </section>
  );
}
