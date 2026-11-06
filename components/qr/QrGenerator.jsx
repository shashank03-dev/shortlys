"use client";

import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { DEFAULT_STYLE } from "@/lib/qr/constants";
import { getContrastRatio } from "@/lib/qr/contrast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { QrForm } from "./QrForm";
import { QrResult } from "./QrResult";
import { QrPreview } from "./QrPreview";

export function QrGenerator({ initialUrl = "", initialShorturl = "", editId = "", onSaved }) {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [mode, setMode] = useState(editId ? "edit" : initialShorturl ? "existing" : "new");
  const [url, setUrl] = useState(initialUrl);
  const [alias, setAlias] = useState("");
  const [label, setLabel] = useState("");
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [existing, setExisting] = useState(initialShorturl ? { shorturl: initialShorturl, destination: initialUrl } : null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(Boolean(editId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) return;
    let active = true;
    fetch(`/api/qr/${editId}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "QR code not found.");
        return body.data;
      })
      .then((qr) => {
        if (!active) return;
        setMode("edit");
        setUrl(qr.destination);
        setLabel(qr.label || "");
        setStyle(qr.style);
        setExisting({ shorturl: qr.shorturl, destination: qr.destination });
      })
      .catch((fetchError) => active && setError(fetchError.message))
      .finally(() => active && setLoadingRecord(false));
    return () => { active = false; };
  }, [editId]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (mode !== "existing" && !url.trim()) {
      setError("Enter a URL.");
      return;
    }
    try {
      if (getContrastRatio(style.fgColor, style.bgColor) < 4.5) throw new Error("Increase foreground/background contrast.");
    } catch (contrastError) {
      setError(contrastError.message);
      return;
    }

    setLoading(true);
    try {
      const body = mode === "existing"
        ? { mode: "existing", shorturl: existing.shorturl, label: label || undefined, style }
        : { url, label, style, ...(mode === "new" ? { mode: "new", ...(alias ? { alias } : {}) } : {}) };
      const response = await fetch(mode === "edit" ? `/api/qr/${editId}` : "/api/qr", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (response.status === 401) {
        openSignIn();
        throw new Error("Sign in to save your QR code.");
      }
      if (!response.ok) {
        if (payload.error?.code === "QR_EXISTS" && payload.error.details?.qrId) {
          window.location.href = `/qr?edit=${payload.error.details.qrId}`;
          return;
        }
        throw new Error(payload.error?.message || payload.message || "Something went wrong.");
      }
      setResult(payload.data);
      onSaved?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setMode("new");
    setUrl("");
    setAlias("");
    setLabel("");
    setStyle(DEFAULT_STYLE);
    setExisting(null);
    setError("");
  };

  if (loadingRecord) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (mode === "edit" && !existing) return <Alert variant="error">{error || "QR code not found."}</Alert>;

  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
      {result ? (
        <QrResult qr={result} onReset={reset} editHref={`/qr?edit=${result.id}`} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_256px]">
        <QrForm
          mode={mode}
          url={url}
          setUrl={setUrl}
          alias={alias}
          setAlias={setAlias}
          label={label}
          setLabel={setLabel}
          style={style}
          setStyle={setStyle}
          onSubmit={submit}
          loading={loading}
          error={error}
          existing={existing}
        />
        <QrPreview value={`${process.env.NEXT_PUBLIC_APP_URL || "https://shortlys.com"}/qr`} style={style} caption="Preview" />
        </div>
      )}
    </div>
  );
}
