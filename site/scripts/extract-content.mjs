// Extracts sections from the source HTML guides into structured JSON.
//
// Each source HTML has the shape:
//   <section id="s1">
//     <div class="section-head"><span class="section-num">01</span><h2>Title</h2></div>
//     <p class="sub">Subtitle</p>
//     ...body (h3, p, div.diagram (with svg + .diagram-caption + .diagram-caption-bn),
//             pre>code, table, div.pill-grid, div.callout, etc.)
//     <aside class="layman">...</aside>
//     <aside class="bangla">...</aside>
//   </section>
//   ...
//   <section class="sources" id="sources"><h2>Sources</h2>...</section>
//
// Output: { slug, title, lede, sections: [{ id, num, title, sub, body, layman, bangla }], sources: [{n, html}] }
//
// Body / layman / bangla are stored as raw HTML strings so we can render them
// verbatim with dangerouslySetInnerHTML and preserve every inline SVG, citation
// link, and code coloring from the original.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const OUT_DIR = resolve(__dirname, "..", "src", "content");
mkdirSync(OUT_DIR, { recursive: true });

const GUIDES = [
  { slug: "llm-fundamentals", file: "llm-fundamentals.html", title: "LLM Fundamentals" },
  { slug: "prompt-engineering", file: "prompt-engineering.html", title: "Prompt Engineering" },
  { slug: "context-engineering", file: "context-engineering.html", title: "Context Engineering" },
  { slug: "rag-knowledge-systems", file: "rag-knowledge-systems.html", title: "RAG & Knowledge Systems" },
];

// The 5th guide was split into 9 chapter files. Each chapter is a one-topic
// single-file HTML reference; the JSON output is the same shape as a guide
// (one section per file), with the original HTML filename used as the slug.
const CHAPTERS = [
  { num: "01", slug: "01-agents-and-agentic-systems",        title: "Agents & agentic systems" },
  { num: "02", slug: "02-tool-use-and-integrations",          title: "Tool use & integrations" },
  { num: "03", slug: "03-inference",                          title: "Inference" },
  { num: "04", slug: "04-llmops-and-observability",           title: "LLMOps & observability" },
  { num: "05", slug: "05-evaluation-engineering",             title: "Evaluation engineering" },
  { num: "06", slug: "06-cost-and-performance-optimization",  title: "Cost & performance optimisation" },
  { num: "07", slug: "07-safety-security-and-guardrails",     title: "Safety, security & guardrails" },
  { num: "08", slug: "08-multimodal-engineering",             title: "Multimodal engineering" },
  { num: "09", slug: "09-ai-application-architecture",         title: "AI application architecture" },
];

// Regexes are anchored on the leading HTML comment-free source. The files are
// well-formed single-line-ish and we process them in order.
//
// 1. Find each <section id="sN"> ... </section> block (greedy enough to handle
//    nested asides — they don't nest sections).
// 2. Inside, pluck the title, sub, and the parts we want to isolate.
const SECTION_RE =
  /<section\s+id="(s\d+)"[^>]*>([\s\S]*?)<\/section>/g;

const TITLE_RE =
  /<div class="section-head"[^>]*>[\s\S]*?<span class="section-num">([^<]+)<\/span>\s*<h2>([\s\S]*?)<\/h2>/;
const SUB_RE = /<p class="sub">([\s\S]*?)<\/p>/;
const LAYMAN_RE = /<aside class="layman">([\s\S]*?)<\/aside>/;
const BANGLA_RE = /<aside class="bangla">([\s\S]*?)<\/aside>/;

// LedE / title / hero from the top of the doc.
const HERO_TITLE_RE = /<div class="hero"[^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/;
const LEDE_RE = /<p class="lede">([\s\S]*?)<\/p>/;

// Sources section: matches through the closing </section> (it sits before
// <footer> and </main>, not after).
const SOURCES_RE = /<section class="sources"[^>]*>([\s\S]*?)<\/section>/;

// One <li id="srcN">...<a href="URL">text</a>...</li> per citation. We
// preserve the URL so the rendered page can deep-link out to the source.
const SOURCE_ROW_RE =
  /<li[^>]*id="src(\d+)"[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/li>/g;
const STRIP_TAGS = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const STRIP_ENTITIES = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

function extract(guide) {
  const html = readFileSync(resolve(REPO, guide.file), "utf8");

  const heroTitle = STRIP_ENTITIES(
    (html.match(HERO_TITLE_RE)?.[1] ?? "").trim(),
  );
  const lede = STRIP_ENTITIES((html.match(LEDE_RE)?.[1] ?? "").trim());

  // Pull out the sources block first so we can ignore it from section capture.
  const sourcesBlock = html.match(SOURCES_RE)?.[1] ?? "";
  const sources = [];
  const seen = new Set();
  for (const m of sourcesBlock.matchAll(SOURCE_ROW_RE)) {
    const n = Number(m[1]);
    if (seen.has(n)) continue; // a few guides list the same source twice
    seen.add(n);
    sources.push({
      n,
      url: m[2],
      text: STRIP_ENTITIES(STRIP_TAGS(m[3])),
    });
  }
  sources.sort((a, b) => a.n - b.n);

  // Strip the sources block before section scanning so we never match it.
  const body = html
    .replace(SOURCES_RE, "")
    // The hero is irrelevant once we have lede.
    .replace(/<div class="hero"[\s\S]*?<\/div>\s*<\/header>/, "");

  const sections = [];
  for (const m of body.matchAll(SECTION_RE)) {
    const id = m[1];
    const inner = m[2];
    const titleMatch = inner.match(TITLE_RE);
    if (!titleMatch) continue;
    const num = titleMatch[1].trim();
    // Decode entities in the title (e.g. "&amp;" → "&") so JSX text rendering
    // doesn't show "Tokens, tokenization &amp; context cost" literally.
    const title = STRIP_ENTITIES(
      STRIP_TAGS(titleMatch[2]).replace(/\s+/g, " "),
    ).trim();

    // The sub is a short <p class="sub">…</p> that may contain inline
    // <strong> and <a class="cite"> tags from the source. Decode its entities
    // (but keep the inner HTML) so we can render it with dangerouslySetInnerHTML.
    const subRaw = (inner.match(SUB_RE)?.[1] ?? "").trim();
    const sub = STRIP_ENTITIES(subRaw);

    // Body = everything between </p> (sub) and the first <aside>. Decode
    // entities so any inline text (e.g. citation text "[15]") renders
    // correctly when injected as HTML.
    let bodyHtml = inner;
    if (subRaw) bodyHtml = bodyHtml.replace(SUB_RE, "");
    const laymanMatch = bodyHtml.match(LAYMAN_RE);
    const banglaMatch = bodyHtml.match(BANGLA_RE);
    const bodyStart =
      bodyHtml.indexOf("</p>") >= 0
        ? bodyHtml.indexOf("</p>") + "</p>".length
        : 0;
    const bodyEnd = (() => {
      const candidates = [laymanMatch?.index, banglaMatch?.index].filter(
        (v) => typeof v === "number",
      );
      if (!candidates.length) return bodyHtml.length;
      return Math.min(...candidates);
    })();
    const bodyOnly = STRIP_ENTITIES(bodyHtml.slice(bodyStart, bodyEnd).trim());

    sections.push({
      id,
      num,
      title,
      sub,
      body: bodyOnly,
      layman: STRIP_ENTITIES((laymanMatch?.[1] ?? "").trim()),
      bangla: STRIP_ENTITIES((banglaMatch?.[1] ?? "").trim()),
    });
  }

  return {
    slug: guide.slug,
    title: guide.title,
    heroTitle: STRIP_TAGS(heroTitle),
    lede,
    sections,
    sources,
  };
}

for (const g of GUIDES) {
  const out = extract(g);
  const path = resolve(OUT_DIR, `${g.slug}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2));
  const counts = {
    title: out.title,
    sections: out.sections.length,
    sources: out.sources.length,
    firstSection: out.sections[0]?.title,
    lastSection: out.sections.at(-1)?.title,
  };
  console.log(`✓ ${g.slug}: ${counts.sections} sections, ${counts.sources} sources`);
  console.log(`  ${counts.firstSection} → ${counts.lastSection}`);
}

console.log("");
for (const c of CHAPTERS) {
  const out = extract({
    slug: c.slug,
    file: `${c.slug}.html`,
    title: c.title,
  });
  // Stamp the chapter number on the JSON so the route knows its place.
  out.num = c.num;
  out.isChapter = true;
  const path = resolve(OUT_DIR, `${c.slug}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2));
  const title = out.sections[0]?.title;
  console.log(`✓ ${c.slug}: 1 section — ${title}`);
}

console.log(`\nWrote JSON to ${OUT_DIR}`);
