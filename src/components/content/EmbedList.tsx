import type { Embed } from "@/lib/content-schema";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { EmbedFrame } from "./EmbedFrame";

/** The "Live view" row under a section intro: one frame or link card per page. */
export function EmbedList({ embeds, sectionId, lang }: { embeds: Embed[]; sectionId: string; lang: Lang }) {
  if (!embeds.length) return null;
  const headingId = `${sectionId}-live`;
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-text-faint"
      >
        {UI[lang].liveHeading(embeds.length)}
      </h3>
      <ul className="mt-4 flex list-none flex-col gap-5 p-0">
        {embeds.map((embed) => (
          <li key={embed.url} className="min-w-0">
            <EmbedFrame embed={embed} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
