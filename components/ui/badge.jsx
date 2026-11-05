import { cn } from "@/lib/utils";

const variants = {
  neutral: "bg-secondary/40 text-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

export function Badge({ className, variant = "neutral", ...props }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}
