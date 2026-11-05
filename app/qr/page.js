import { QrWorkspace } from "@/components/qr/QrWorkspace";

export const metadata = {
  title: "QR Code Generator | Shortlys",
  description: "Turn a link into a QR code. Shortlys encodes the short link, not the long URL.",
};

function pick(value) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function QrPage({ searchParams }) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="relative overflow-hidden px-6 pb-10 pt-28">
        <div className="pointer-events-none absolute inset-0 qr-grid opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">QR codes</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Turn a link into a QR code.</h1>
          <p className="mt-3 text-muted-foreground">We encode the short link, not the long URL.</p>
          <div className="mt-8">
            <QrWorkspace key={JSON.stringify(params)} initialUrl={pick(params.url)} initialShorturl={pick(params.shorturl)} editId={pick(params.edit)} />
          </div>
        </div>
      </section>
    </div>
  );
}
