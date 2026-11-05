import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrEmptyState({ signedIn }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-10 text-center">
      <QrCode className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-sm text-muted-foreground">No QR codes yet.</p>
      {!signedIn ? <Link href="/qr" className="mt-4 inline-block"><Button size="sm">Create QR code</Button></Link> : null}
    </div>
  );
}
