import Link from "next/link";
import type { Topic } from "@/lib/topics";

function partLabel(part: number): string {
  return `Part ${String(part).padStart(2, "0")}`;
}

const CARD =
  "group block rounded-2xl border border-border bg-bg-raised px-5 py-5 no-underline transition-colors hover:border-border-strong hover:bg-bg-raised-2";

/** Cards that link to the previous and the next Part. */
export function PrevNext({ prev, next }: { prev?: Topic; next?: Topic }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="Previous and next Part" className="grid gap-4 sm:grid-cols-2">
      {prev && (
        <Link href={`/topics/${prev.slug}`} rel="prev" className={CARD}>
          <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
            ← {partLabel(prev.part)}
          </span>
          <span className="mt-2 block font-display text-xl leading-snug text-text transition-colors group-hover:text-accent">
            {prev.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          href={`/topics/${next.slug}`}
          rel="next"
          className={CARD + " sm:col-start-2 sm:text-right"}
        >
          <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
            {partLabel(next.part)} →
          </span>
          <span className="mt-2 block font-display text-xl leading-snug text-text transition-colors group-hover:text-accent">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
