import type { Source } from "@/lib/content-schema";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

/**
 * The numbered citation list at the end of a topic. Each `li` has the id
 * `src<n>`: the `<a class="cite" href="#src<n>">` links in the body jump to it.
 */
export function Sources({ sources, lang }: { sources: Source[]; lang: Lang }) {
  if (!sources.length) return null;
  const ui = UI[lang];
  return (
    <section aria-labelledby="sources-title" className="border-t border-border pt-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint">
        {ui.references}
      </p>
      <h2
        id="sources-title"
        className="mt-3 font-display text-3xl font-medium tracking-[-0.01em] text-text"
      >
        {ui.sources}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-faint">{ui.sourcesNote}</p>
      <ol className="mt-8 list-none divide-y divide-border p-0">
        {sources.map((s) => (
          <li
            key={s.n}
            id={`src${s.n}`}
            className="grid scroll-mt-24 grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2 rounded-md py-3 text-sm leading-relaxed transition-colors target:bg-accent/10"
          >
            <span className="pl-1 pt-[3px] font-mono text-xs text-text-faint">[{s.n}]</span>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-text-dim no-underline [overflow-wrap:anywhere] hover:text-accent"
            >
              {s.text}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
