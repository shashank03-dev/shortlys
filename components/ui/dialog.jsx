"use client";

import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

export function Dialog({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
      className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
