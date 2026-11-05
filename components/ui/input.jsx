import { cn } from "@/lib/utils";

export function Input({ label, helper, error, className, id, ...props }) {
  const inputId = id || props.name;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium">{label}</label>}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          "h-12 w-full rounded-xl border border-border bg-background/70 px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-destructive focus:border-destructive focus:ring-destructive/10",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive">{error}</p>
      ) : helper ? (
        <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
