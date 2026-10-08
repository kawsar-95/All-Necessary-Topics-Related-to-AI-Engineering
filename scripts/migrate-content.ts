// One-time migration to src/content/<slug>.json (typed blocks), in the
// 13-part order. Sources in scripts/legacy-content/:
//   <old>.json  slug, title, lede, sources, section ids/nums/titles
//   <old>.html  the original page; section sub/body/layman/bangla text
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/migrate-content.ts

import { readFileSync, writeFileSync } from "node:fs";
import { TopicFileSchema } from "../src/lib/content-schema.ts";
import type { Block, Section, Source, TopicFile } from "../src/lib/content-schema.ts";
import { parseBlocks } from "./migrate/blocks.ts";
import { createHighlight, detectLang, highlightBlocks } from "./migrate/code.ts";
import type { Lang } from "./migrate/code.ts";
import { blocksText, collapse, compareText, inlineText, legacyText } from "./migrate/fidelity.ts";
import type { Mismatch } from "./migrate/fidelity.ts";
import { inlineFromHtml } from "./migrate/inline.ts";
import { extractSection } from "./migrate/source.ts";
import { parse } from "node-html-parser";

type Part = { old: string; slug: string; title: string; tagline?: string };

const PARTS: Part[] = [
  { old: "llm-fundamentals", slug: "llm-fundamentals", title: "LLM Fundamentals", tagline: "from an engineer's lens" },
  { old: "prompt-engineering", slug: "prompt-engineering", title: "Prompt Engineering" },
  { old: "context-engineering", slug: "context-engineering", title: "Context Engineering", tagline: 'the new "prompt engineering"' },
  { old: "rag-knowledge-systems", slug: "rag-knowledge-systems", title: "RAG and Knowledge Systems" },
  { old: "01-agents-and-agentic-systems", slug: "agents-and-agentic-systems", title: "Agents and Agentic Systems" },
  { old: "02-tool-use-and-integrations", slug: "tool-use-and-integrations", title: "Tool Use and Integrations" },
  { old: "03-inference", slug: "inference", title: "Inference" },
  { old: "04-llmops-and-observability", slug: "llmops-and-observability", title: "LLMOps and Observability" },
  { old: "05-evaluation-engineering", slug: "evaluation-engineering", title: "Evaluation Engineering" },
  { old: "06-cost-and-performance-optimization", slug: "cost-and-performance-optimization", title: "Cost and Performance Optimization" },
  { old: "07-safety-security-and-guardrails", slug: "safety-security-and-guardrails", title: "Safety, Security, and Guardrails" },
  { old: "08-multimodal-engineering", slug: "multimodal-engineering", title: "Multimodal Engineering" },
  { old: "09-ai-application-architecture", slug: "ai-application-architecture", title: "AI Application Architecture" },
];

// Section order overrides, by new slug (Amendment 1: GraphRAG after metadata filtering).
const SECTION_ORDER: Record<string, string[]> = {
  "rag-knowledge-systems": ["s1", "s2", "s3", "s4", "s5", "s7", "s8", "s6", "s9", "s10"],
};

// Keyed `${old}#${sectionId}#${voice}#${codeIndex}`, for blocks where detectLang is wrong.
// The Python blocks below have no def/class/import line, so detection says "text".
const CODE_LANG_OVERRIDES: Record<string, Lang> = {
  "llm-fundamentals#s4#body#0": "python", // client.chat.completions.create(...) call
  "prompt-engineering#s1#body#0": "python", // messages = [...] with an f-string
  "prompt-engineering#s2#body#0": "python", // prompt = """...""" assignment
  "prompt-engineering#s4#body#2": "xml", // XML-tagged system message after one comment line
  "context-engineering#s3#body#0": "python", // messages = [...] with cache_control
  "rag-knowledge-systems#s8#body#0": "python", // llm_json(...) / index.query(...)
  "02-tool-use-and-integrations#s2#body#0": "python", // tools=[{...}] assignment
};

type LegacySection = {
  id: string;
  num: string;
  title: string;
  sub: string;
  body: string;
  layman: string;
  bangla: string;
};
type LegacyFile = { lede: string; sections: LegacySection[]; sources: Source[] };

type Voice = "body" | "layman" | "bangla";
const LEGACY_DIR = new URL("./legacy-content/", import.meta.url);
const OUT_DIR = new URL("../src/content/", import.meta.url);

const warnings: string[] = [];
const codeRows: { key: string; firstLine: string; lang: Lang; override: boolean }[] = [];
const mismatches: { where: string; m: Mismatch }[] = [];
const countLines: string[] = [];
const restoreRows: { where: string; legacy: number; original: number }[] = [];
let fallbackCount = 0;

function countBlocks(blocks: Block[], counts: Record<string, number>): void {
  for (const block of blocks) {
    counts[block.type] = (counts[block.type] ?? 0) + 1;
    if (block.type === "html") fallbackCount++;
    if (block.type === "callout" || block.type === "analogy") countBlocks(block.blocks, counts);
    if (block.type === "panels") for (const p of block.panels) countBlocks(p.blocks, counts);
  }
}

function totalBlocks(blocks: Block[]): number {
  return blocks.reduce((n, block) => {
    if (block.type === "callout" || block.type === "analogy") return n + 1 + totalBlocks(block.blocks);
    if (block.type === "panels") {
      return n + 1 + block.panels.reduce((m, p) => m + totalBlocks(p.blocks), 0);
    }
    return n + 1;
  }, 0);
}

function check(where: string, legacy: string, migrated: string): void {
  const m = compareText(legacy, migrated);
  if (m) mismatches.push({ where, m });
}

function reorder(sections: LegacySection[], order: string[] | undefined): LegacySection[] {
  if (!order) return sections;
  const byId = new Map(sections.map((s) => [s.id, s]));
  if (order.length !== sections.length || order.some((id) => !byId.has(id))) {
    throw new Error(`section order does not match sections: ${order.join(" ")}`);
  }
  return order.map((id) => byId.get(id) as LegacySection);
}

const highlight = await createHighlight();

for (const part of PARTS) {
  const legacy = JSON.parse(
    readFileSync(new URL(`${part.old}.json`, LEGACY_DIR), "utf8"),
  ) as LegacyFile;
  const page = parse(readFileSync(new URL(`${part.old}.html`, LEGACY_DIR), "utf8"));
  const headingIds = new Set<string>();
  const counts: Record<string, number> = {};

  const lede = inlineFromHtml(legacy.lede, warnings);
  check(`${part.old}#lede`, legacyText(legacy.lede), collapse(inlineText(lede)));

  const sections: Section[] = reorder(legacy.sections, SECTION_ORDER[part.slug]).map((s, n) => {
    // Section text comes from the original HTML page; the legacy JSON
    // clipped many bodies. Ids, numbers, and titles come from the JSON.
    const original = extractSection(page, s.id, `${part.old}.html`);
    const local: string[] = [];
    const sub = inlineFromHtml(original.sub, local);
    for (const w of local) warnings.push(`${part.old}#${s.id}#sub: ${w}`);
    check(`${part.old}#${s.id}#sub`, legacyText(original.sub), collapse(inlineText(sub)));

    const voice = (key: Voice): Block[] => {
      const where = `${part.old}#${s.id}#${key}`;
      const parsed = parseBlocks(original[key], { where, warnings, headingIds, sectionId: s.id });
      const blocks = highlightBlocks(parsed, highlight, (code, i) => {
        const override = CODE_LANG_OVERRIDES[`${where}#${i}`];
        const lang = override ?? detectLang(code);
        const firstLine = code.split("\n").find((l) => l.trim() !== "") ?? "";
        codeRows.push({ key: `${where}#${i}`, firstLine, lang, override: Boolean(override) });
        return lang;
      });
      countBlocks(blocks, counts);
      check(where, legacyText(original[key]), blocksText(blocks));
      return blocks;
    };

    // Technical block count: legacy JSON body vs original HTML body.
    const legacyBody = parseBlocks(s.body, {
      where: `${part.old}#${s.id}#legacy-body`,
      warnings: [],
      headingIds: new Set<string>(),
      sectionId: s.id,
    });
    const body = voice("body");
    restoreRows.push({
      where: `${part.slug}#${s.id}`,
      legacy: totalBlocks(legacyBody),
      original: totalBlocks(body),
    });

    return {
      id: s.id,
      num: String(n + 1).padStart(2, "0"),
      title: s.title,
      sub,
      body,
      layman: voice("layman"),
      bangla: voice("bangla"),
    };
  });

  const topic: TopicFile = TopicFileSchema.parse({
    slug: part.slug,
    title: part.title,
    ...(part.tagline ? { tagline: part.tagline } : {}),
    lede,
    sections,
    sources: legacy.sources,
  });
  writeFileSync(new URL(`${part.slug}.json`, OUT_DIR), `${JSON.stringify(topic, null, 2)}\n`);

  const summary = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, n]) => `${type}=${n}`)
    .join(" ");
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  countLines.push(`${part.slug}.json (${sections.length} sections, ${total} blocks): ${summary}`);
}

console.log(`# Migration report\n\nFiles written: ${PARTS.length}\n`);
console.log("## Block counts (nested blocks included)");
for (const line of countLines) console.log(`- ${line}`);

console.log(`\n## Warnings (${warnings.length})`);
for (const w of warnings) console.log(`- ${w}`);

console.log(`\n## Code blocks (${codeRows.length})`);
console.log("| where#i | lang | first line |");
console.log("|---|---|---|");
for (const row of codeRows) {
  const lang = row.override ? `${row.lang} (override)` : row.lang;
  console.log(`| ${row.key} | ${lang} | ${row.firstLine.trim().slice(0, 70).replaceAll("|", "\\|")} |`);
}

console.log(`\n## html fallback blocks: ${fallbackCount}`);

console.log("\n## Technical blocks: legacy JSON body vs original HTML body (nested included)");
console.log("| section | legacy JSON | original HTML |");
console.log("|---|---|---|");
for (const row of restoreRows) console.log(`| ${row.where} | ${row.legacy} | ${row.original} |`);

const textCount = mismatches.filter(({ m }) => m.kind === "text").length;
console.log(
  `\n## Fidelity check: ${mismatches.length} mismatches (${textCount} text, ${mismatches.length - textCount} whitespace-only)`,
);
for (const { where, m } of mismatches) {
  console.log(`- [${m.kind}] ${where} at char ${m.at}`);
  console.log(`    legacy:   ${JSON.stringify(m.legacy)}`);
  console.log(`    migrated: ${JSON.stringify(m.migrated)}`);
}
