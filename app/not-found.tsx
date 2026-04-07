import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
        <span className="text-2xl font-bold">?</span>
      </div>
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
