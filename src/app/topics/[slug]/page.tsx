import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOPIC_ORDER, TOPICS, getNeighbors, getTopic, stripTags } from "@/lib/topics";
import { Inline } from "@/components/content/Inline";
import { SectionView } from "@/components/content/SectionView";
import { SectionNav } from "@/components/SectionNav";
import { Sources } from "@/components/Sources";

type Params = { slug: string };

// The whole route is static. An unknown slug then waits for the full render
// instead of getting the 200 App Shell, so notFound() sends a real 404.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return TOPIC_ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  return {
    title: topic.title,
    description: stripTags(topic.lede).trim().slice(0, 200),
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const { prev, next } = getNeighbors(slug);
  const sectionCount = topic.sections.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 pb-8 border-b border-border">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/" className="text-text-dim no-underline hover:text-accent">
            ← All topics
          </Link>
          <span className="text-text-faint">·</span>
          <span>
            Part {topic.part} of {TOPICS.length}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05] mb-4">
          {topic.title}
          {topic.tagline && (
            <span className="block mt-2 text-2xl sm:text-3xl font-semibold text-text-dim">
              {topic.tagline}
            </span>
          )}
        </h1>
        <Inline
          as="p"
          html={topic.lede}
          className="text-lg text-text-dim max-w-3xl leading-relaxed"
        />
        <div className="mt-5 font-mono text-xs text-text-faint flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {sectionCount} section{sectionCount === 1 ? "" : "s"} · {topic.sources.length}{" "}
            sources · three voices per section
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-12">
        <article className="min-w-0 space-y-20">
          {topic.sections.map((s) => (
            <SectionView key={s.id} section={s} />
          ))}
          <Sources sources={topic.sources} />
        </article>
        <SectionNav sections={topic.sections} />
      </div>

      <nav className="mt-24 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-y-3 text-sm">
        {prev ? (
          <Link
            href={`/topics/${prev.slug}`}
            className="text-text-dim no-underline hover:text-accent"
          >
            <span className="font-mono text-xs text-text-faint block">
              ← Previous · Part {prev.part}
            </span>
            <span>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/topics/${next.slug}`}
            className="text-text-dim no-underline hover:text-accent text-right"
          >
            <span className="font-mono text-xs text-text-faint block">
              Next · Part {next.part} →
            </span>
            <span>{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
