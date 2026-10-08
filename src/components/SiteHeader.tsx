import Link from "next/link";

// Top navigation bar. Plain server component — no client state, no JS shipped
// for this piece except the Link prefetcher.
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-text no-underline"
        >
          <span
            aria-hidden
            className="inline-block w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent-2"
          />
          <span>AI Engineering</span>
          <span className="text-text-faint font-normal hidden sm:inline">
            / All Necessary Topics
          </span>
        </Link>
      </div>
    </header>
  );
}
