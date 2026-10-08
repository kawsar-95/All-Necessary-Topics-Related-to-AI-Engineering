import { TopicPage, topicMetadata, topicStaticParams } from "@/components/pages/TopicPage";
import type { TopicParams } from "@/components/pages/TopicPage";

export const dynamicParams = false;
export const generateStaticParams = topicStaticParams;

export function generateMetadata({ params }: { params: Promise<TopicParams> }) {
  return topicMetadata(params, "bn");
}

export default function Page({ params }: { params: Promise<TopicParams> }) {
  return <TopicPage params={params} lang="bn" />;
}
