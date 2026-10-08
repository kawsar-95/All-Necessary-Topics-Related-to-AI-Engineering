// Server-only access to the 13 topic files. Never import this module from a
// "use client" file; pass the data down as props.
//
// Each file goes through TopicFileSchema.parse at module load, so bad content
// fails `next build`.

import { TopicFileSchema } from "@/lib/content-schema";
import type { Section, TopicFile } from "@/lib/content-schema";
import type { Lang } from "@/lib/i18n";

import llmFundamentals from "@/content/llm-fundamentals.json";
import promptEngineering from "@/content/prompt-engineering.json";
import contextEngineering from "@/content/context-engineering.json";
import ragKnowledgeSystems from "@/content/rag-knowledge-systems.json";
import agentsAndAgenticSystems from "@/content/agents-and-agentic-systems.json";
import toolUseAndIntegrations from "@/content/tool-use-and-integrations.json";
import inference from "@/content/inference.json";
import llmopsAndObservability from "@/content/llmops-and-observability.json";
import evaluationEngineering from "@/content/evaluation-engineering.json";
import costAndPerformanceOptimization from "@/content/cost-and-performance-optimization.json";
import safetySecurityAndGuardrails from "@/content/safety-security-and-guardrails.json";
import multimodalEngineering from "@/content/multimodal-engineering.json";
import aiApplicationArchitecture from "@/content/ai-application-architecture.json";

export type Topic = TopicFile & { part: number };
export type OutlineItem = { id: string; title: string; level: 2 | 3 };
export type NavItem = { part: number; slug: string; title: string };

// The one place that sets the Part order (Part 1 first).
export const TOPIC_ORDER: readonly string[] = [
  "llm-fundamentals",
  "prompt-engineering",
  "context-engineering",
  "rag-knowledge-systems",
  "agents-and-agentic-systems",
  "tool-use-and-integrations",
  "inference",
  "llmops-and-observability",
  "evaluation-engineering",
  "cost-and-performance-optimization",
  "safety-security-and-guardrails",
  "multimodal-engineering",
  "ai-application-architecture",
];

const FILES: Record<string, unknown> = {
  "llm-fundamentals": llmFundamentals,
  "prompt-engineering": promptEngineering,
  "context-engineering": contextEngineering,
  "rag-knowledge-systems": ragKnowledgeSystems,
  "agents-and-agentic-systems": agentsAndAgenticSystems,
  "tool-use-and-integrations": toolUseAndIntegrations,
  inference: inference,
  "llmops-and-observability": llmopsAndObservability,
  "evaluation-engineering": evaluationEngineering,
  "cost-and-performance-optimization": costAndPerformanceOptimization,
  "safety-security-and-guardrails": safetySecurityAndGuardrails,
  "multimodal-engineering": multimodalEngineering,
  "ai-application-architecture": aiApplicationArchitecture,
};

export const TOPICS: Topic[] = TOPIC_ORDER.map((slug, i) => {
  const topic = TopicFileSchema.parse(FILES[slug]);
  if (topic.slug !== slug) {
    throw new Error(`Topic file for "${slug}" has slug "${topic.slug}"`);
  }
  return { ...topic, part: i + 1 };
});

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getNeighbors(slug: string): { prev?: Topic; next?: Topic } {
  const i = TOPICS.findIndex((t) => t.slug === slug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? TOPICS[i - 1] : undefined,
    next: i < TOPICS.length - 1 ? TOPICS[i + 1] : undefined,
  };
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

/** The title, tagline, and intro of a topic in `lang`. */
export function topicText(topic: Topic, lang: Lang): { title: string; tagline?: string; lede: string } {
  return lang === "bn" ? topic.bn : { title: topic.title, tagline: topic.tagline, lede: topic.lede };
}

/** The title and intro of a section in `lang`. */
export function sectionText(section: Section, lang: Lang): { title: string; sub: string } {
  return lang === "bn" ? section.bn : { title: section.title, sub: section.sub };
}

/**
 * The page outline. Section titles follow `lang`. The h3 headings of a
 * one-section topic come from the Technical body, which is English only.
 */
export function getOutline(topic: Topic, lang: Lang = "en"): OutlineItem[] {
  const single = topic.sections.length === 1;
  return topic.sections.flatMap((section) => {
    const item: OutlineItem = { id: section.id, title: sectionText(section, lang).title, level: 2 };
    if (!single) return [item];
    const headings = section.body.flatMap((block): OutlineItem[] =>
      block.type === "heading" && block.level === 3
        ? [{ id: block.id, title: stripTags(block.html), level: 3 }]
        : [],
    );
    return [item, ...headings];
  });
}

export function getNavItems(lang: Lang = "en"): NavItem[] {
  return TOPICS.map((t) => ({ part: t.part, slug: t.slug, title: topicText(t, lang).title }));
}
