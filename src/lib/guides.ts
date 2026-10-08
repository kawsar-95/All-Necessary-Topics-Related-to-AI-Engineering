// Typed access to the content JSON.
//
// Two namespaces:
//
//   GUIDES   — the four "full" guides (LLM Fundamentals, Prompt
//              Engineering, Context Engineering, RAG).
//   CHAPTERS — the nine single-topic chapter files that together
//              replaced the old "Agents & Agentic Systems" guide.
//              Each chapter is one topic; each renders the same way
//              the full guides do (one section per file) but with a
//              shared "inter-chapter" navigation block at the bottom.

import llm from "@/content/llm-fundamentals.json";
import prompt from "@/content/prompt-engineering.json";
import context from "@/content/context-engineering.json";
import rag from "@/content/rag-knowledge-systems.json";

import ch01 from "@/content/01-agents-and-agentic-systems.json";
import ch02 from "@/content/02-tool-use-and-integrations.json";
import ch03 from "@/content/03-inference.json";
import ch04 from "@/content/04-llmops-and-observability.json";
import ch05 from "@/content/05-evaluation-engineering.json";
import ch06 from "@/content/06-cost-and-performance-optimization.json";
import ch07 from "@/content/07-safety-security-and-guardrails.json";
import ch08 from "@/content/08-multimodal-engineering.json";
import ch09 from "@/content/09-ai-application-architecture.json";

export type Section = {
  id: string;
  num: string;
  title: string;
  sub: string;
  body: string; // HTML, includes inline SVGs
  layman: string; // HTML
  bangla: string; // HTML
};

export type Source = { n: number; url: string; text: string };

export type Guide = {
  slug: string;
  title: string;
  heroTitle: string;
  lede: string;
  sections: Section[];
  sources: Source[];
};

export type Chapter = Guide & {
  num: string; // "01".."09"
  isChapter: true;
};

export const GUIDES: Guide[] = [llm, prompt, context, rag];

export const CHAPTERS: Chapter[] = [
  ch01 as Chapter,
  ch02 as Chapter,
  ch03 as Chapter,
  ch04 as Chapter,
  ch05 as Chapter,
  ch06 as Chapter,
  ch07 as Chapter,
  ch08 as Chapter,
  ch09 as Chapter,
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function getSlugs() {
  return GUIDES.map((g) => g.slug);
}

export function getChapterSlugs() {
  return CHAPTERS.map((c) => c.slug);
}

export function getNeighbors(slug: string): {
  prev?: Chapter;
  next?: Chapter;
} {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? CHAPTERS[i - 1] : undefined,
    next: i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : undefined,
  };
}
