import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found.</h1>
      <Link href="/" className="mt-5 text-sm font-medium text-primary hover:underline">Back home</Link>
    </div>
  );
}
