import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuide, getSlugs } from "@/lib/guides";
import { SectionView } from "@/components/SectionView";
import { SectionNav } from "@/components/SectionNav";
import { Sources } from "@/components/Sources";

type Params = { slug: string };

export function generateStaticParams() {
  return getSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  // Strip HTML from the lede for the description.
  const desc = guide.lede.replace(/<[^>]+>/g, "").trim();
  return {
    title: guide.title,
    description: desc.slice(0, 200),
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 pb-8 border-b border-border">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          AI Engineering Guide
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05] mb-4"
          dangerouslySetInnerHTML={{ __html: guide.heroTitle }}
        />
        <p
          className="text-lg text-text-dim max-w-3xl leading-relaxed"
          dangerouslySetInnerHTML={{ __html: guide.lede }}
        />
        <div className="mt-5 font-mono text-xs text-text-faint flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {guide.sections.length} topics · {guide.sources.length} sources ·
            three voices per section
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-12">
        <article className="min-w-0 space-y-20">
          {guide.sections.map((s) => (
            <SectionView key={s.id} section={s} />
          ))}
          <Sources sources={guide.sources} />
        </article>
        <SectionNav sections={guide.sections} />
      </div>
    </div>
  );
}
