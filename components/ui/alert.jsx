import { cn } from "@/lib/utils";

const variants = {
  info: "border-border bg-secondary/20",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function Alert({ variant = "info", className, children }) {
  return <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm", variants[variant], className)}>{children}</div>;
}
