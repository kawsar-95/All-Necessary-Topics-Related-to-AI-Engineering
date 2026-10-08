import type { Topic } from "@/lib/topics";
import { Inline } from "./Inline";

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** The opening of a topic page: Part eyebrow, title, tagline, lede, meta. */
export function TopicHeader({ topic }: { topic: Topic }) {
  return (
    <header className="mb-20 sm:mb-24">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
        Part {String(topic.part).padStart(2, "0")}
      </p>
      <h1 className="mt-5 font-display text-[clamp(2.5rem,7vw,3.75rem)] font-medium leading-[1.03] tracking-[-0.025em] text-balance text-text">
        {topic.title}
      </h1>
      {topic.tagline && (
        <p className="mt-3 font-display text-[clamp(1.25rem,3vw,1.625rem)] italic leading-snug text-text-dim">
          {topic.tagline}
        </p>
      )}
      <Inline
        as="p"
        html={topic.lede}
        className="mt-8 text-lg leading-relaxed text-pretty text-text-dim sm:text-xl sm:leading-relaxed"
      />
      <p className="mt-10 border-t border-border pt-4 font-mono text-xs text-text-faint">
        {plural(topic.sections.length, "section")} · {plural(topic.sources.length, "source")} ·
        three voices
      </p>
    </header>
  );
}
