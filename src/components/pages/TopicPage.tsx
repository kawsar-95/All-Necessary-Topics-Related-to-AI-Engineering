import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOPIC_ORDER, getNeighbors, getOutline, getTopic, stripTags, topicText } from "@/lib/topics";
import type { Lang } from "@/lib/i18n";
import { PrevNext } from "@/components/content/PrevNext";
import { SectionView } from "@/components/content/SectionView";
import { Sources } from "@/components/content/Sources";
import { TopicHeader } from "@/components/content/TopicHeader";
import { SectionNav } from "@/components/navigation/SectionNav";

export type TopicParams = { slug: string };

/** One static page per topic, for each language route. */
export function topicStaticParams(): TopicParams[] {
  return TOPIC_ORDER.map((slug) => ({ slug }));
}

export async function topicMetadata(params: Promise<TopicParams>, lang: Lang): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  const text = topicText(topic, lang);
  return {
    title: text.title,
    description: stripTags(text.lede).trim().slice(0, 200),
  };
}

/** A topic page in one language. */
export async function TopicPage({ params, lang }: { params: Promise<TopicParams>; lang: Lang }) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const { prev, next } = getNeighbors(slug);
  const neighbor = (t?: typeof topic) => t && { slug: t.slug, part: t.part, title: topicText(t, lang).title };

  return (
    <div className="mx-auto w-full max-w-[728px] px-4 py-12 sm:px-6 sm:py-16 xl:grid xl:max-w-[1012px] xl:grid-cols-[minmax(0,680px)_220px] xl:gap-16">
      <article className="min-w-0">
        <TopicHeader topic={topic} lang={lang} />
        <div className="space-y-24">
          {topic.sections.map((s) => (
            <SectionView key={s.id} section={s} lang={lang} />
          ))}
        </div>
        <div className="mt-28 space-y-20">
          <Sources sources={topic.sources} lang={lang} />
          <PrevNext prev={neighbor(prev)} next={neighbor(next)} lang={lang} />
        </div>
      </article>
      <aside className="hidden xl:block">
        <SectionNav items={getOutline(topic, lang)} lang={lang} />
      </aside>
    </div>
  );
}
