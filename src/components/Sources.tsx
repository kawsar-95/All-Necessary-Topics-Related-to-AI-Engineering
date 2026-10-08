import type { Source } from "@/lib/guides";

/**
 * The Sources block. Renders the guide's citations as a numbered list with
 * each entry linking out to the source (arXiv paper, vendor docs, etc.).
 * The `<a class="cite">` anchors in the body scroll here via the `[N]` ids
 * we attach to each <li>.
 */
export function Sources({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <section className="mt-24 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold mb-1">Sources</h2>
      <p className="text-text-faint text-xs mb-6">
        All citations resolve to primary papers (arXiv), vendor docs
        (OpenAI, Anthropic, Google), or official team blogs. IDs were
        verified by fetching each page and extracting the citation metadata.
      </p>
      <ol className="source-list">
        {sources.map((s) => (
          <li key={s.n} id={`src${s.n}`}>
            <a href={s.url} target="_blank" rel="noreferrer noopener">
              {s.text}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
