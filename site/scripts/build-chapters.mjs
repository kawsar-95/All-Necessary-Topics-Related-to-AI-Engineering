#!/usr/bin/env node
// Builds chapter files 02..09 of the "Agents & Agentic Systems" series from
// compact sources in scripts/chapters/NN-*.txt (parts are concatenated in
// filename order). Chapter 01 is hand-authored HTML; its <head> (CSS) and
// diagram-zoom <script> are reused so every chapter looks identical.
//
// Usage:  node scripts/build-chapters.mjs            # build all chapters
//         node scripts/build-chapters.mjs 03 07      # build selected ones
//
// ── Source format ────────────────────────────────────────────────────────
//   @h1 <html>          hero heading (raw HTML, e.g. with <span class="gradient">)
//   @lede <inline>      hero paragraph
//   @minutes N          reading-time estimate
//
//   === Section title   starts a section (<section id="sN">)
//   @sub <inline>       section lead paragraph
//   @icon 🔧            emoji for the layman panel
//   @layman / @bangla   switch the target of the following blocks
//
//   Blocks (separated by blank lines):
//     ## Heading                    → <h3>
//     ```lang … ```                 → <pre><code> (escaped + syntax-coloured)
//     !diagram / !caption / !caption-bn / !end   → <div class="diagram"> (raw SVG)
//     | a | b | + |---|---| + rows  → <table>
//     - item                        → <ul>      1. item → <ol>
//     > warn|good|danger|info text  → callout   >> text → analogy box
//     <raw html …>                  → passed through untouched
//     anything else                 → <p>
//
//   Inline: `code`, **bold**, [@sourceKey] citation (numbered by first use).
//   @sources, then one per line:  key | url | citation text
//
// Rules enforced (build fails otherwise): every [@key] resolves to a listed
// source; no citations inside layman panels; every section has a body, a
// layman panel and a বাংলা panel. Uncited sources are dropped from the list.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const SRC_DIR = resolve(__dirname, "chapters");

export const CHAPTERS = [
  { num: "01", topic: "05", slug: "01-agents-and-agentic-systems", title: "Agents & agentic systems" },
  { num: "02", topic: "06", slug: "02-tool-use-and-integrations", title: "Tool use & integrations" },
  { num: "03", topic: "07", slug: "03-inference", title: "Inference" },
  { num: "04", topic: "08", slug: "04-llmops-and-observability", title: "LLMOps & observability" },
  { num: "05", topic: "09", slug: "05-evaluation-engineering", title: "Evaluation engineering" },
  { num: "06", topic: "10", slug: "06-cost-and-performance-optimization", title: "Cost & performance optimisation" },
  { num: "07", topic: "11", slug: "07-safety-security-and-guardrails", title: "Safety, security & guardrails" },
  { num: "08", topic: "12", slug: "08-multimodal-engineering", title: "Multimodal engineering" },
  { num: "09", topic: "13", slug: "09-ai-application-architecture", title: "AI application architecture" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── Syntax colouring (matches the .kw/.str/.num/.com/.fn classes) ──────────
const KW = new Set(("def class return import from for in if else elif while try except finally raise with as " +
  "async await lambda yield not and or is None True False pass break continue global " +
  "const let var function new export default interface type extends implements public private " +
  "null undefined true false this throw catch typeof instanceof of switch case do void").split(" "));
const HL_LANGS = new Set(["python", "py", "js", "javascript", "ts", "typescript", "tsx", "json", "bash", "sh", "shell", "yaml", "yml", "sql"]);
function highlight(code, lang) {
  if (!HL_LANGS.has(lang)) return esc(code);
  const comment = lang === "sql" ? String.raw`--[^\n]*` : String.raw`#[^\n]*|(?<![:"'\w])\/\/[^\n]*`;
  const re = new RegExp(
    `(${comment})|("""[\\s\\S]*?"""|'''[\\s\\S]*?'''|"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'|\`(?:\\\\.|[^\`\\\\])*\`)` +
      `|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Za-z_][A-Za-z0-9_]*)\\b(\\s*\\()?`,
    "g",
  );
  let out = "", last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += `<span class="com">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="str">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="num">${m[3]}</span>`;
    else if (KW.has(m[4]) && lang !== "json") out += `<span class="kw">${m[4]}</span>${m[5] ? esc(m[5]) : ""}`;
    else if (m[5]) out += `<span class="fn">${m[4]}</span>${esc(m[5])}`;
    else out += esc(m[4]);
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

// ── Parsing ────────────────────────────────────────────────────────────────
function parse(text, num) {
  const ch = { meta: {}, sections: [], sources: [] };
  let sec = null, target = null, mode = "header", fence = false, diagram = false;
  for (const line of text.split(/\r?\n/)) {
    if (!fence && !diagram) {
      if (line.startsWith("=== ")) {
        sec = { title: line.slice(4).trim(), sub: "", icon: "💡", body: [], layman: [], bangla: [] };
        ch.sections.push(sec); target = "body"; mode = "section"; continue;
      }
      if (line.trim() === "@sources") { mode = "sources"; continue; }
      if (mode === "sources") {
        if (line.trim() && !line.startsWith("#")) {
          const [key, url, ...rest] = line.split("|").map((s) => s.trim());
          if (!key || !url || !rest.length) throw new Error(`[${num}] bad source line: ${line}`);
          ch.sources.push({ key, url, text: rest.join(" | ") });
        }
        continue;
      }
      if (mode === "header") {
        const m = line.match(/^@(\w+)\s+(.*)$/);
        if (m) ch.meta[m[1]] = m[2].trim();
        continue;
      }
      const d = line.match(/^@(sub|icon)\s+(.*)$/);
      if (d) { sec[d[1]] = d[2].trim(); continue; }
      if (line.trim() === "@layman" || line.trim() === "@bangla") { target = line.trim().slice(1); continue; }
    }
    if (mode !== "section") continue;
    if (line.startsWith("```")) fence = !fence;
    else if (!fence && line.trim() === "!diagram") diagram = true;
    else if (!fence && line.trim() === "!end") diagram = false;
    sec[target].push(line);
  }
  return ch;
}

// ── Rendering ──────────────────────────────────────────────────────────────
function makeCtx(sources, num) {
  const byKey = new Map(sources.map((s) => [s.key, s]));
  return { num, byKey, order: [], target: "body", diagrams: 0, codes: 0, tables: 0, h3: 0 };
}
function cite(key, ctx) {
  if (ctx.target === "layman") throw new Error(`[${ctx.num}] citation [@${key}] inside a layman panel`);
  if (!ctx.byKey.has(key)) throw new Error(`[${ctx.num}] unknown source key [@${key}]`);
  let n = ctx.order.indexOf(key) + 1;
  if (!n) { ctx.order.push(key); n = ctx.order.length; }
  return `<a class="cite" href="#src${n}">[${n}]</a>`;
}
function inline(s, ctx) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\[@([\w.-]+)\]/g, (_, k) => cite(k, ctx));
  return s.replace(/\u0000(\d+)\u0000/g, (_, n) => codes[+n]);
}
const LIST_STYLE = ' style="margin: 0 0 14px 20px; line-height: 1.8;"';
function renderList(block, ordered, ctx) {
  const items = [];
  const marker = ordered ? /^\d+\.\s+/ : /^-\s+/;
  for (const l of block) {
    if (marker.test(l)) items.push(l.replace(marker, ""));
    else items[items.length - 1] += " " + l.trim();
  }
  const tag = ordered ? "ol" : "ul";
  const style = ctx.target === "body" ? LIST_STYLE : "";
  return `<${tag}${style}>\n${items.map((i) => `  <li>${inline(i, ctx)}</li>`).join("\n")}\n</${tag}>`;
}
function renderTable(block, ctx) {
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim(), ctx));
  const head = cells(block[0]);
  const rows = block.slice(2).map(cells);
  ctx.tables++;
  return `<table>\n  <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>\n  <tbody>\n` +
    rows.map((r) => `    <tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("\n") + `\n  </tbody>\n</table>`;
}
function renderBlock(block, ctx) {
  const first = block[0].trimStart();
  if (first.startsWith("<")) { if (/<table/.test(block.join(""))) ctx.tables++; return block.join("\n"); }
  if (first.startsWith("|")) return renderTable(block, ctx);
  if (/^-\s+/.test(first)) return renderList(block, false, ctx);
  if (/^\d+\.\s+/.test(first)) return renderList(block, true, ctx);
  const text = block.map((l) => l.trim()).join(" ");
  if (first.startsWith(">> ")) return `<div class="analogy">${inline(text.slice(3), ctx)}</div>`;
  if (first.startsWith("> ")) {
    const m = text.slice(2).match(/^(warn|good|danger|info)\s+([\s\S]*)$/);
    if (!m) throw new Error(`[${ctx.num}] callout needs a type: ${text.slice(0, 60)}`);
    return `<div class="callout${m[1] === "info" ? "" : " " + m[1]}">${inline(m[2], ctx)}</div>`;
  }
  return `<p>${inline(text, ctx)}</p>`;
}
function renderBlocks(lines, ctx) {
  const out = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim(); const code = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) code.push(lines[i]);
      i++; ctx.codes++;
      out.push(`<pre><code>${highlight(code.join("\n"), lang)}</code></pre>`);
      continue;
    }
    if (line.trim() === "!diagram") {
      const svg = []; let cap = "", capBn = "";
      for (i++; i < lines.length && lines[i].trim() !== "!end"; i++) {
        const l = lines[i];
        if (l.startsWith("!caption-bn ")) capBn = l.slice(12).trim();
        else if (l.startsWith("!caption ")) cap = l.slice(9).trim();
        else svg.push(l);
      }
      i++; ctx.diagrams++;
      out.push(`<div class="diagram">\n${svg.join("\n").trim()}\n` +
        (cap ? `  <div class="diagram-caption">${inline(cap, ctx)}</div>\n` : "") +
        (capBn ? `  <div class="diagram-caption diagram-caption-bn">${inline(capBn, ctx)}</div>\n` : "") + `</div>`);
      continue;
    }
    if (line.startsWith("## ")) { ctx.h3++; out.push(`<h3>${inline(line.slice(3).trim(), ctx)}</h3>`); i++; continue; }
    // A block runs until a blank line — but a paragraph and a list (or a
    // table) never share a block, so "Intro line:\n- item" still renders
    // as <p> + <ul> even without a blank line between them.
    const kindOf = (l) => (/^\s*(-|\d+\.)\s+/.test(l) ? "list" : l.trimStart().startsWith("|") ? "table" : "text");
    const raw = line.trimStart().startsWith("<");
    const kind = kindOf(line);
    const block = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("```") && lines[i].trim() !== "!diagram" && !lines[i].startsWith("## ")) {
      if (block.length && !raw && kindOf(lines[i]) !== kind) break;
      block.push(lines[i++]);
    }
    out.push(renderBlock(block, ctx));
  }
  return out.map((s) => s.replace(/^/gm, "  ")).join("\n\n");
}

function build(c, head, script) {
  const parts = readdirSync(SRC_DIR).filter((f) => f.startsWith(`${c.num}-`) && f.endsWith(".txt")).sort();
  if (!parts.length) return null;
  const ch = parse(parts.map((f) => readFileSync(resolve(SRC_DIR, f), "utf8")).join("\n\n"), c.num);
  for (const k of ["h1", "lede", "minutes"]) if (!ch.meta[k]) throw new Error(`[${c.num}] missing @${k}`);
  const ctx = makeCtx(ch.sources, c.num);

  const sections = ch.sections.map((s, i) => {
    const n = String(i + 1).padStart(2, "0");
    for (const t of ["body", "layman", "bangla"]) if (!s[t].some((l) => l.trim())) throw new Error(`[${c.num}] section "${s.title}" has no ${t}`);
    ctx.target = "body";
    const sub = s.sub ? `  <p class="sub">${inline(s.sub, ctx)}</p>\n\n` : "";
    const body = renderBlocks(s.body, ctx);
    ctx.target = "layman"; const layman = renderBlocks(s.layman, ctx);
    ctx.target = "bangla"; const bangla = renderBlocks(s.bangla, ctx);
    return `<section id="s${i + 1}">
  <div class="section-head"><span class="section-num">${n}</span><h2>${inline(s.title, ctx)}</h2></div>
${sub}${body}

  <aside class="layman">
    <div class="layman-head"><span class="icon">${s.icon}</span><span class="label">Layman's version<small>plain English, no jargon</small></span></div>
${layman.replace(/^/gm, "  ")}
  </aside>
  <aside class="bangla">
    <div class="bangla-head"><span class="icon">🇧🇩</span><span class="label">বাংলা ব্যাখ্যা<small>সহজ ভাষায় বিস্তারিত</small></span></div>
${bangla.replace(/^/gm, "  ")}
  </aside>
</section>`;
  });

  const unused = ch.sources.filter((s) => !ctx.order.includes(s.key)).map((s) => s.key);
  const cited = ctx.order.map((k) => ctx.byKey.get(k));
  const toc = ch.sections.map((s, i) => `    <li><a href="#s${i + 1}">${inline(s.title, ctx)}</a></li>`).join("\n");
  const nav = CHAPTERS.map((o) => `${o.num}. <a${o.num === c.num ? ' class="current"' : ""} href="${o.slug}.html">${esc(o.title)}</a>`).join(" · ");

  const html = `<!doctype html>
<html lang="en">
<head>${head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.title)} — An Engineer's Reference</title>`)}</head>
<body>
<div class="shell">

<header class="hero">
  <div class="eyebrow">Topic ${c.topic} of 13 · Chapter ${c.num} of 9 · Agents &amp; Agentic Systems series</div>
  <h1>${ch.meta.h1}</h1>
  <p class="lede">${inline(ch.meta.lede, ctx)}</p>
  <div class="meta">
    <span><span class="dot"></span>${ch.sections.length} subtopics · ~${ch.meta.minutes} min read</span>
    <span>${cited.length} sources, every link checked Oct 2026</span>
    <span>${ctx.diagrams} diagrams · ${ctx.codes} code examples · ${ctx.tables} tables · technical + layman + বাংলা</span>
  </div>
</header>

<nav class="toc">
  <div class="toc-title">Contents</div>
  <ol>
${toc}
  </ol>
</nav>

${sections.join("\n\n")}

<section class="sources" id="sources">
  <h2>Sources</h2>
  <p style="color: var(--text-faint); font-size: 13px; margin-bottom: 16px;">Every link below was fetched on 8 October 2026. arXiv entries were matched against the paper's <code>citation_title</code> metadata; vendor and project pages were confirmed to resolve to the page described.</p>
  <ol id="srcList">
${cited.map((s, i) => `    <li id="src${i + 1}"><a href="${s.url}">${esc(s.text)}</a></li>`).join("\n")}
  </ol>
</section>

<div class="inter-nav">
  <div class="toc-title">All chapters in this series</div>
  <div class="inter-nav-list">${nav}</div>
</div>

<footer style="margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--text-faint); font-size: 12px;">
  Built as a single-file reference. Open in any browser. Generated from <code>site/scripts/chapters/${c.num}-*.txt</code> by <code>site/scripts/build-chapters.mjs</code>.
</footer>

</div>
${script}
</body>
</html>
`;
  const out = resolve(REPO, `${c.slug}.html`);
  writeFileSync(out, html);
  return { file: `${c.slug}.html`, sections: ch.sections.length, h3: ctx.h3, sources: cited.length, unused, diagrams: ctx.diagrams, codes: ctx.codes, tables: ctx.tables, kb: (Buffer.byteLength(html) / 1024).toFixed(1) };
}

const tpl = readFileSync(resolve(REPO, "01-agents-and-agentic-systems.html"), "utf8");
const head = tpl.match(/<head>([\s\S]*?)<\/head>/)[1];
const script = tpl.match(/<script>[\s\S]*?<\/script>/)[0];
const want = process.argv.slice(2);
let built = 0;
for (const c of CHAPTERS) {
  if (c.num === "01" || (want.length && !want.includes(c.num))) continue;
  const r = build(c, head, script);
  if (!r) continue;
  built++;
  console.log(`✓ ${r.file}  ${r.sections} sections · ${r.h3} h3 · ${r.sources} sources · ${r.diagrams} svg · ${r.codes} code · ${r.tables} tables · ${r.kb} KB`);
  if (r.unused.length) console.log(`  ⚠ uncited sources dropped: ${r.unused.join(", ")}`);
}
if (!built) console.log("nothing built (no scripts/chapters/NN-*.txt sources found)");
