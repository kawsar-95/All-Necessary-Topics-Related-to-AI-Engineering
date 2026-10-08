import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOPIC_ORDER, getNeighbors, getOutline, getTopic, stripTags } from "@/lib/topics";
import { PrevNext } from "@/components/content/PrevNext";
import { SectionView } from "@/components/content/SectionView";
import { Sources } from "@/components/content/Sources";
import { TopicHeader } from "@/components/content/TopicHeader";
import { SectionNav } from "@/components/navigation/SectionNav";

type Params = { slug: string };

export const dynamicParams = false;

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

  return (
    <div className="mx-auto w-full max-w-[728px] px-4 py-12 sm:px-6 sm:py-16 xl:grid xl:max-w-[1012px] xl:grid-cols-[minmax(0,680px)_220px] xl:gap-16">
      <article className="min-w-0">
        <TopicHeader topic={topic} />
        <div className="space-y-24">
          {topic.sections.map((s) => (
            <SectionView key={s.id} section={s} />
          ))}
        </div>
        <div className="mt-28 space-y-20">
          <Sources sources={topic.sources} />
          <PrevNext prev={prev} next={next} />
        </div>
      </article>
      <aside className="hidden xl:block">
        <SectionNav items={getOutline(topic)} />
      </aside>
    </div>
  );
}
