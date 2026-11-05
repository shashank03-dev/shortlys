"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCard } from "./QrCard";
import { QrEmptyState } from "./QrEmptyState";

export function QrManageSection({ revision = 0 }) {
  const { isSignedIn, isLoaded } = useUser();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState(null);

  const load = async (nextCursor) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/qr?limit=12${nextCursor ? `&cursor=${nextCursor}` : ""}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not load QR codes.");
      setItems((current) => (nextCursor ? [...current, ...body.data.items] : body.data.items));
      setCursor(body.data.nextCursor);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
  }, [isLoaded, isSignedIn, revision]);

  const remove = async () => {
    if (!target) return;
    try {
      const response = await fetch(`/api/qr/${target.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not delete QR code.");
      setItems((current) => current.filter((item) => item.id !== target.id));
      setTarget(null);
    } catch (deleteError) {
      setError(deleteError.message);
      setTarget(null);
    }
  };

  if (!isLoaded || !isSignedIn) return null;

  const visible = items.filter((item) => {
    const value = search.toLowerCase();
    return !value || [item.label, item.shorturl, item.destination].some((field) => field?.toLowerCase().includes(value));
  });

  return (
    <section id="your-qr-codes" className="mx-auto mt-16 max-w-5xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Your QR codes</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search QR codes" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-40 pl-9" />
          </div>
          <Link href="/qr" className={buttonVariants({ variant: "outline", size: "sm", className: "h-10" })}>New QR</Link>
        </div>
      </div>

      {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}

      {loading && items.length === 0 ? (
        <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3].map((key) => <Skeleton key={key} className="h-32" />)}</div>
      ) : visible.length === 0 ? (
        <QrEmptyState signedIn />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{visible.map((qr) => <QrCard key={qr.id} qr={qr} onDelete={setTarget} />)}</div>
      )}

      {cursor ? (
        <div className="mt-5 text-center">
          <Button variant="outline" size="sm" onClick={() => load(cursor)} disabled={loading}>{loading ? "Loading…" : "Load more"}</Button>
        </div>
      ) : null}

      <Dialog open={Boolean(target)} onClose={() => setTarget(null)} title="Delete QR code?">
        <p className="text-sm text-muted-foreground">
          {target?.createdShortLink ? "Deletes the QR and its short link. Printed codes stop working." : "Removes the QR. The short link keeps working."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </Dialog>
    </section>
  );
}
