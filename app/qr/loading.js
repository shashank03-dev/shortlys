import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-12 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <Skeleton className="mt-8 h-80 w-full rounded-3xl" />
    </div>
  );
}
