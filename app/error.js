"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try again.</p>
      <Button className="mt-6" onClick={reset}>Retry</Button>
    </div>
  );
}
