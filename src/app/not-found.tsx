import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="font-mono text-[11px] uppercase tracking-wider text-accent mb-3">
        404
      </div>
      <h1 className="text-4xl font-extrabold mb-3">Guide not found</h1>
      <p className="text-text-dim mb-8">
        That guide doesn&apos;t exist. All five published guides are
        linked from the home page.
      </p>
      <Link
        href="/"
        className="inline-block px-4 py-2 rounded-md bg-accent text-bg font-mono text-sm no-underline"
      >
        ← Back to all guides
      </Link>
    </div>
  );
}
