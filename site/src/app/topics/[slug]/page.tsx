import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CHAPTERS,
  getChapter,
  getChapterSlugs,
  getNeighbors,
} from "@/lib/guides";
import { SectionView } from "@/components/SectionView";
import { Sources } from "@/components/Sources";

type Params = { slug: string };

export function generateStaticParams() {
  return getChapterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return {};
  const desc = chapter.lede.replace(/<[^>]+>/g, "").trim();
  return {
    title: `${chapter.title} — chapter ${chapter.num} of 9`,
    description: desc.slice(0, 200),
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const { prev, next } = getNeighbors(slug);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 pb-8 border-b border-border">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/"
            className="text-text-dim no-underline hover:text-accent"
          >
            ← All guides
          </Link>
          <span className="text-text-faint">·</span>
          <span>
            Chapter {chapter.num} of 9 · Agents &amp; Agentic Systems
          </span>
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05] mb-4"
          dangerouslySetInnerHTML={{ __html: chapter.heroTitle }}
        />
        <p
          className="text-lg text-text-dim max-w-3xl leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.lede }}
        />
        <div className="mt-5 font-mono text-xs text-text-faint flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            1 topic · {chapter.sources.length} sources · three voices
          </span>
          <a
            href={`/guides-html/${chapter.slug}.html`}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View original single-file HTML →
          </a>
        </div>
      </header>

      <article className="min-w-0 space-y-20">
        {chapter.sections.map((s) => (
          <SectionView key={s.id} section={s} />
        ))}
        <Sources sources={chapter.sources} />
      </article>

      <nav className="mt-24 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-y-3 text-sm">
        {prev ? (
          <Link
            href={`/topics/${prev.slug}`}
            className="text-text-dim no-underline hover:text-accent"
          >
            <span className="font-mono text-xs text-text-faint block">
              ← Previous · chapter {prev.num}
            </span>
            <span
              dangerouslySetInnerHTML={{ __html: prev.heroTitle }}
            />
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
              Next · chapter {next.num} →
            </span>
            <span
              dangerouslySetInnerHTML={{ __html: next.heroTitle }}
            />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <div className="mt-12 p-6 rounded-xl bg-bg-card-2 border border-border">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-faint mb-3">
          All chapters in this guide
        </div>
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm list-none p-0 m-0">
          {CHAPTERS.map((c) => {
            const isCurrent = c.slug === chapter.slug;
            return (
              <li key={c.slug}>
                <Link
                  href={`/topics/${c.slug}`}
                  className={
                    isCurrent
                      ? "text-accent no-underline"
                      : "text-text-dim no-underline hover:text-accent"
                  }
                >
                  <span className="font-mono text-xs text-text-faint mr-2">
                    {c.num}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: c.title }} />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
