import Link from "next/link";
import { TOPICS, getOutline, topicText } from "@/lib/topics";
import type { Topic } from "@/lib/topics";
import { UI, fmtNum, topicHref } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Inline } from "@/components/content/Inline";

const TOTAL_SECTIONS = TOPICS.reduce((sum, t) => sum + t.sections.length, 0);

/**
 * The titles to show under a Part in the index. A multi-section topic shows
 * its section titles. A one-section topic shows the h3 titles of that
 * section, because its only section title says nothing new.
 */
function outlineTitles(topic: Topic, lang: Lang): string[] {
  const level = topic.sections.length === 1 ? 3 : 2;
  return getOutline(topic, lang)
    .filter((item) => item.level === level)
    .map((item) => item.title);
}

/** The landing page: an index of the 13 Parts, in one language. */
export function HomePage({ lang }: { lang: Lang }) {
  const ui = UI[lang];
  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 pb-8 sm:px-8 sm:pt-20">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
          {ui.homeEyebrow(fmtNum(lang, TOPICS.length), fmtNum(lang, TOTAL_SECTIONS))}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.5rem,8vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-balance text-text">
          {ui.homeTitle}
        </h1>
        <Inline
          as="p"
          html={ui.homeIntro}
          className="mt-8 text-lg leading-relaxed text-pretty text-text-dim sm:text-xl sm:leading-relaxed"
        />
      </header>

      <section aria-labelledby="contents-heading" className="mt-16 sm:mt-24">
        <h2
          id="contents-heading"
          className="border-b border-border-strong pb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-dim"
        >
          {ui.contents}
        </h2>
        <ol className="m-0 list-none p-0">
          {TOPICS.map((topic) => {
            const text = topicText(topic, lang);
            return (
              <li
                key={topic.slug}
                className="group relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-b border-border py-7 sm:grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] sm:gap-x-6 sm:py-9"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[2.25rem] font-light leading-[0.9] tracking-[-0.04em] text-text-faint tabular-nums transition-colors group-hover:text-accent sm:text-[4rem]"
                >
                  {fmtNum(lang, topic.part).padStart(2, fmtNum(lang, 0))}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.5rem] font-medium leading-tight tracking-[-0.015em] text-balance sm:text-[1.875rem]">
                    <Link
                      href={topicHref(topic.slug, lang)}
                      className="text-text no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-accent"
                    >
                      {text.title}
                    </Link>
                  </h3>
                  {text.tagline && (
                    <p className="mt-1 font-display text-lg italic leading-snug text-text-dim">
                      {text.tagline}
                    </p>
                  )}
                  <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-pretty text-text-dim sm:line-clamp-none sm:text-[15px]">
                    {outlineTitles(topic, lang).join(", ")}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="hidden pt-2 font-mono text-base text-text-faint transition-all group-hover:translate-x-1 group-hover:text-accent sm:block"
                >
                  →
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
