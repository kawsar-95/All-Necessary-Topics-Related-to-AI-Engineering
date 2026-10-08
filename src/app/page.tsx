import Link from "next/link";
import { TOPICS, getOutline } from "@/lib/topics";
import type { Topic } from "@/lib/topics";

const TOTAL_SECTIONS = TOPICS.reduce((sum, t) => sum + t.sections.length, 0);

/**
 * The titles to show under a Part in the index. A multi-section topic shows
 * its section titles. A one-section topic shows the h3 titles of that
 * section, because its only section title says nothing new.
 */
function outlineTitles(topic: Topic): string[] {
  const level = topic.sections.length === 1 ? 3 : 2;
  return getOutline(topic)
    .filter((item) => item.level === level)
    .map((item) => item.title);
}

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 pb-8 sm:px-8 sm:pt-20">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
          Reference · {TOPICS.length} parts · {TOTAL_SECTIONS} sections
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.5rem,8vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-balance text-text">
          All necessary topics related to AI Engineering
        </h1>
        <p className="mt-8 text-lg leading-relaxed text-pretty text-text-dim sm:text-xl sm:leading-relaxed">
          A dense, citation-backed reference for the fundamentals every
          applied AI engineer needs — from tokens and tool use to retrieval,
          context, and agent loops. Each topic ships in three voices: the
          engineer&apos;s version (with code and diagrams), the layman&apos;s
          version (plain English with analogies), and{" "}
          <span lang="bn" className="text-voice-bangla">
            বাংলা ব্যাখ্যা
          </span>
          .
        </p>
      </header>

      <section aria-labelledby="contents-heading" className="mt-16 sm:mt-24">
        <h2
          id="contents-heading"
          className="border-b border-border-strong pb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-faint"
        >
          Contents
        </h2>
        <ol className="m-0 list-none p-0">
          {TOPICS.map((topic) => (
            <li
              key={topic.slug}
              className="group relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-b border-border py-7 sm:grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] sm:gap-x-6 sm:py-9"
            >
              <span
                aria-hidden="true"
                className="font-display text-[2.25rem] font-light leading-[0.9] tracking-[-0.04em] text-text-faint tabular-nums transition-colors group-hover:text-accent sm:text-[4rem]"
              >
                {String(topic.part).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-[1.5rem] font-medium leading-tight tracking-[-0.015em] text-balance sm:text-[1.875rem]">
                  <Link
                    href={`/topics/${topic.slug}`}
                    className="text-text no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-accent"
                  >
                    {topic.title}
                  </Link>
                </h3>
                {topic.tagline && (
                  <p className="mt-1 font-display text-lg italic leading-snug text-text-dim">
                    {topic.tagline}
                  </p>
                )}
                <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-pretty text-text-faint sm:line-clamp-none sm:text-[15px]">
                  {outlineTitles(topic).join(", ")}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="hidden pt-2 font-mono text-base text-text-faint transition-all group-hover:translate-x-1 group-hover:text-accent sm:block"
              >
                →
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
