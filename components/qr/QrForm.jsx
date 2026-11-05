"use client";

import { ClipboardPaste, LockKeyhole } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrStylePanel } from "./QrStylePanel";

export function QrForm({
  mode,
  url,
  setUrl,
  alias,
  setAlias,
  label,
  setLabel,
  style,
  setStyle,
  onSubmit,
  loading,
  error,
  existing,
}) {
  const paste = async () => {
    try {
      setUrl(await navigator.clipboard.readText());
    } catch {
      // Clipboard permission is optional.
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mode === "existing" ? (
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4" /> Using /{existing?.shorturl}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{existing?.destination}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            label="Destination URL"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com/page"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            maxLength={16384}
            helper="We create a short link and encode that."
            required
          />
          <button type="button" onClick={paste} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </button>
        </div>
      )}

      <Accordion title="Customize">
        <div className="space-y-4">
          {mode === "new" ? (
            <Input
              label="Custom short link"
              name="alias"
              placeholder="launch-2026"
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              maxLength={32}
              helper="3–32 characters: a–z, 0–9, -, _."
            />
          ) : null}
          <Input
            label="Name"
            name="label"
            placeholder="Spring menu"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={80}
            helper="Private."
          />
          <QrStylePanel style={style} onChange={setStyle} />
        </div>
      </Accordion>

      {mode === "edit" ? <p className="text-sm text-muted-foreground">Printed codes will point to the new destination.</p> : null}

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Button type="submit" size="lg" className="w-full" disabled={loading || (mode !== "existing" && !url.trim())}>
        {loading ? "Creating…" : mode === "edit" ? "Save changes" : "Create QR code"}
      </Button>
    </form>
  );
}
