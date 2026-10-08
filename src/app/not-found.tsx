import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { UI } from "@/lib/i18n";

/**
 * The one 404 page for both languages (GitHub Pages serves it for every
 * unknown URL). It shows the English text with the Bangla text under it.
 */
export default function NotFound() {
  const { en, bn } = UI;
  return (
    <SiteShell lang="en">
      <div className="mx-auto max-w-2xl px-5 pt-20 pb-8 sm:px-8 sm:pt-28">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
          {en.notFoundEyebrow}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.5rem,8vw,4rem)] font-medium leading-[1.03] tracking-[-0.03em] text-text">
          {en.notFoundTitle}
        </h1>
        <p lang="bn" className="mt-2 font-display text-2xl text-text-dim">
          {bn.notFoundTitle}
        </p>
        <p className="mt-6 text-lg leading-relaxed text-pretty text-text-dim">{en.notFoundText}</p>
        <p lang="bn" className="mt-2 text-lg leading-relaxed text-pretty text-text-dim">
          {bn.notFoundText}
        </p>
        <p className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
          <Link href="/" className="font-mono text-sm text-accent no-underline transition-colors hover:text-text">
            {en.notFoundBack}
          </Link>
          <Link href="/bn/" lang="bn" className="text-sm text-accent no-underline transition-colors hover:text-text">
            {bn.notFoundBack}
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
