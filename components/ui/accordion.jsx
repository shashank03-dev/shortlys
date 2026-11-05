import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ title, children, className }) {
  return (
    <details className={cn("group rounded-xl border border-border/60 bg-background/40", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border/60 p-4">{children}</div>
    </details>
  );
}
