import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-20 pb-8 sm:px-8 sm:pt-28">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
        Error 404
      </p>
      <h1 className="mt-5 font-display text-[clamp(2.5rem,8vw,4rem)] font-medium leading-[1.03] tracking-[-0.03em] text-text">
        Page not found
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-pretty text-text-dim">
        That page does not exist. All 13 parts are listed on the home page.
      </p>
      <p className="mt-10 border-t border-border pt-6">
        <Link
          href="/"
          className="font-mono text-sm text-accent no-underline transition-colors hover:text-text"
        >
          ← Back to all parts
        </Link>
      </p>
    </div>
  );
}
