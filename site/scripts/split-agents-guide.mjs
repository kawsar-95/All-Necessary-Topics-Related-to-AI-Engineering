#!/usr/bin/env node
// Splits agents-agentic-systems.html into 9 chapter files (one per topic).
// Each output is a standalone single-file HTML reference, same shape as
// the other guides in this repo (llm-fundamentals.html, etc.) but with
// a one-topic layout and a 9-item bottom-of-page TOC that links to the
// other chapter files.
//
// Inputs:  agents-agentic-systems.html (the master, full-of-content file)
// Outputs: ../NN-slug.html   (NN = "01".."09")

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");

const MASTER = resolve(REPO, "agents-agentic-systems.html");
const master = readFileSync(MASTER, "utf8");

// ── 1. Extract <head>…</head>, hero, TOC ─────────────────────────────────
const headMatch = master.match(/<head>([\s\S]*?)<\/head>/);
if (!headMatch) throw new Error("No <head> in master");
const HEAD = headMatch[1];

// Hero + TOC + first nav
const heroMatch = master.match(/<header class="hero">([\s\S]*?)<\/header>/);
const tocMatch  = master.match(/<nav class="toc">([\s\S]*?)<\/nav>/);
if (!heroMatch || !tocMatch) throw new Error("No hero or TOC in master");

// Footer script
const scriptMatch = master.match(/<script>\s*\(function \(\)[\s\S]*?\}\)\(\);\s*<\/script>/);
const SCRIPT = scriptMatch ? scriptMatch[0] : "";

// ── 2. Extract each section (s1..s9) plus the shared Sources block ──────
function extractSection(id) {
  const re = new RegExp(`<section id="${id}">([\\s\\S]*?)<\\/section>`);
  const m = master.match(re);
  if (!m) throw new Error(`No section ${id}`);
  return `<section id="${id}">${m[1]}</section>`;
}
const SECTIONS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9"].map(extractSection);

// Sources block (shared across all 9 chapter files; each renders citations
// for the topic it covers — but since citations are in the section body
// and only the per-section numbers are referenced, the shared sources list
// is identical to the master's).
const sourcesMatch = master.match(/<section class="sources" id="sources">([\s\S]*?)<\/section>/);
if (!sourcesMatch) throw new Error("No sources block");
const SOURCES = `<section class="sources" id="sources">${sourcesMatch[1]}</section>`;

// ── 3. Per-chapter metadata ──────────────────────────────────────────────
const CHAPTERS = [
  { num: "01", slug: "agents-and-agentic-systems",
    title: "Agents &amp; agentic systems",
    lede: "How LLM agents plan, act, remember, and recover — the four canonical loops (ReAct, Plan-and-Execute, Reflexion, ReWOO), single- vs multi-agent orchestration, state machines and workflow graphs, memory, human-in-the-loop, subagents, error recovery, durable execution, and browser/computer-use agents." },
  { num: "02", slug: "tool-use-and-integrations",
    title: "Tool use &amp; integrations (incl. MCP)",
    lede: "How an LLM becomes an actor: tool/function schema design, parallel tool calling, Model Context Protocol (MCP) servers/clients/resources/prompts, sandboxed code execution (E2B, Modal, Daytona, Cloudflare), API wrappers, and tool-result formatting for LLM consumption." },
  { num: "03", slug: "inference",
    title: "Inference (servers, quantization, providers)",
    lede: "API-based vs self-hosted inference; vLLM, TGI, SGLang, Ollama, llama.cpp; GGUF/AWQ/GPTQ/INT4-INT8 quantisation; KV cache, prefix caching, speculative decoding; continuous batching; TTFT vs TPS; GPU economics, edge inference, and the major hosted providers (Together, Fireworks, Groq, Cerebras, Replicate, AWS Bedrock)." },
  { num: "04", slug: "llmops-and-observability",
    title: "LLMOps &amp; observability",
    lede: "Tracing with Langfuse / LangSmith / Helicone / Arize Phoenix / Braintrust; per-request token, cost, and latency tracking; prompt and agent versioning; A/B testing; replay and debugging; drift detection when model upgrades silently change behaviour; feedback loops that grow your eval dataset." },
  { num: "05", slug: "evaluation-engineering",
    title: "Evaluation engineering",
    lede: "Offline evals on golden datasets, LLM-as-judge (pairwise + rubric), RAG metrics (faithfulness, answer relevance, context precision/recall via Ragas), agent evals (task success, trajectory, tool-call accuracy), synthetic data generation, frameworks (Promptfoo, DeepEval, Inspect, Braintrust, OpenAI Evals), online evals on production traffic, and red-teaming." },
  { num: "06", slug: "cost-and-performance-optimization",
    title: "Cost &amp; performance optimisation",
    lede: "Model cascading, semantic / output / prompt caching, batch APIs, distillation, LLMLingua-style prompt compression, per-feature token budgets, and model gateways (LiteLLM, Portkey, OpenRouter) — a five-tier stack that can cut LLM spend by 5–50× without losing quality." },
  { num: "07", slug: "safety-security-and-guardrails",
    title: "Safety, security &amp; guardrails",
    lede: "Direct and indirect prompt injection, jailbreak resistance, data exfiltration via tool calls and rendered links, content moderation (OpenAI, Azure, Llama Guard), guardrail frameworks (NeMo Guardrails, Guardrails AI), PII redaction, rate limiting, output validation, and audit logging for compliance." },
  { num: "08", slug: "multimodal-engineering",
    title: "Multimodal engineering (vision, voice, video)",
    lede: "Vision (OCR-via-LLM, document AI), voice (STT/TTS, realtime APIs from OpenAI / LiveKit / Vapi), image generation (Flux, SDXL, Imagen, DALL-E; ControlNet, LoRA, ComfyUI), and video generation (Sora, Veo, Runway, Kling)." },
  { num: "09", slug: "ai-application-architecture",
    title: "AI application architecture",
    lede: "Streaming over SSE / WebSockets / chunked HTTP, background jobs and queues for long agent runs, idempotency and resumability, multi-tenant prompt and key management, fallback chains across providers, feature flags for prompts and models, and API design patterns for AI features (cancel, retry, partial results)." },
];

// ── 4. Build the inter-chapter nav (rendered at the bottom of each file) ─
function interNav(currentIdx) {
  const items = CHAPTERS.map((c, i) => {
    const cls = i === currentIdx ? ' class="current"' : "";
    const sep = i > 0 ? " · " : "";
    return `${sep}<a${cls} href="${c.slug}.html">${String(i + 1).padStart(2, "0")}. ${unescapeHtml(c.title)}</a>`;
  }).join("");
  return `<div class="inter-nav"><div class="toc-title">All chapters in this guide</div><div class="inter-nav-list">${items}</div></div>`;
}

function unescapeHtml(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// ── 5. Build each chapter file ──────────────────────────────────────────
const HERO = heroMatch[0];
const TOC_NAV = tocMatch[0];

for (let i = 0; i < CHAPTERS.length; i++) {
  const c = CHAPTERS[i];
  const section = SECTIONS[i];
  // Per-file TOC: replace the master's 9-item list with a single-item
  // list pointing to the current topic (others are linked via the
  // interNav at the bottom).
  const tocForFile = TOC_NAV.replace(
    /(<ol>)([\s\S]*?)(<\/ol>)/,
    `$1\n    <li><a href="#${section.match(/id="([^"]+)"/)[1]}">${unescapeHtml(c.title)}</a></li>\n  $3`
  );

  const body = [
    '<!doctype html>',
    '<html lang="en">',
    `<head>${HEAD.replace(/<title>[^<]+<\/title>/, `<title>${unescapeHtml(c.title)} — An Engineer's Reference</title>`)}</head>`,
    '<body>',
    '<div class="shell">',
    HERO.replace(
      /<h1>[\s\S]*?<\/h1>/,
      `<h1>${unescapeHtml(c.title)} <span class="gradient">— chapter ${c.num} of 9</span></h1>`
    ).replace(
      /<p class="lede">[\s\S]*?<\/p>/,
      `<p class="lede">${c.lede} This is chapter <strong>${c.num}</strong> of a 9-part series; every chapter is a single self-contained HTML file. <strong style="color: var(--accent-warn);">Each section ships in two voices:</strong> the engineer's version (technical, with code &amp; diagrams) and a layman's version (plain English with analogies). প্রতিটি টপিকের শেষে বাংলা ব্যাখ্যাও আছে।</p>`
    ),
    tocForFile,
    section,
    SOURCES,
    interNav(i),
    '<footer style="margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--text-faint); font-size: 12px;">',
    '  Built as a single-file reference. Open in any browser. Citations verified against each publisher\'s metadata at fetch time.',
    '</footer>',
    '</div>',
    SCRIPT,
    '</body>',
    '</html>',
  ].join("\n");

  const out = resolve(REPO, `${c.num}-${c.slug}.html`);
  writeFileSync(out, body);
  const lines = body.split("\n").length;
  const bytes = Buffer.byteLength(body, "utf8");
  console.log(`✓ ${c.num}-${c.slug}.html  ${lines} lines  ${(bytes / 1024).toFixed(1)} KB`);
}

// ── 6. Add a small CSS block for the interNav to the head (only the
//       master has it; the chapter files include it once). ─────────────
const interNavCss = `<style>
.inter-nav { margin-top: 64px; padding: 18px 22px; background: var(--bg-card-2); border: 1px solid var(--border); border-radius: 12px; }
.inter-nav .toc-title { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-faint); margin-bottom: 12px; }
.inter-nav-list { font-size: 13px; line-height: 1.8; color: var(--text-dim); }
.inter-nav-list a { color: var(--text-dim); text-decoration: none; padding: 2px 4px; border-radius: 4px; }
.inter-nav-list a:hover { background: var(--bg-card); color: var(--accent); }
.inter-nav-list a.current { color: var(--accent); background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.25); }
</style>`;

// Re-emit each file with the interNav CSS appended to the head. We do
// this in a second pass so the CSS lives in one place.
for (let i = 0; i < CHAPTERS.length; i++) {
  const c = CHAPTERS[i];
  const out = resolve(REPO, `${c.num}-${c.slug}.html`);
  let html = readFileSync(out, "utf8");
  if (!html.includes("inter-nav {")) {
    html = html.replace("</head>", `${interNavCss}\n</head>`);
    writeFileSync(out, html);
  }
}
console.log("\n✓ Inter-chapter nav CSS injected into all 9 files");
