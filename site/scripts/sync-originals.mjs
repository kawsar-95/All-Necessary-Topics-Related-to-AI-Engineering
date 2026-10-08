// Copies the original single-file HTML guides (and the standalone
// index.html) from the repo root into site/public/ so the Next.js
// server can serve them as static assets at:
//
//   /index.html
//   /guides-html/<slug>.html           (4 full guides)
//   /guides-html/NN-<chapter>.html     (9 chapter files)
//
// The previous "Agents & Agentic Systems" 9-topic master file was
// split into 9 single-topic chapter files (01-..09-). Each Next.js
// chapter page links to its own /guides-html/NN-<slug>.html; the
// homepage links to the standalone index plus all 13 originals.
// Re-run this after editing the source HTML files in the parent
// directory, or pass --watch to do it on a timer during local dev.

import { copyFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const PUBLIC = resolve(__dirname, "..", "public");
const GUIDES_DIR = resolve(PUBLIC, "guides-html");

const CHAPTER_SLUGS = [
  "01-agents-and-agentic-systems",
  "02-tool-use-and-integrations",
  "03-inference",
  "04-llmops-and-observability",
  "05-evaluation-engineering",
  "06-cost-and-performance-optimization",
  "07-safety-security-and-guardrails",
  "08-multimodal-engineering",
  "09-ai-application-architecture",
];

const GUIDE_SLUGS = [
  "llm-fundamentals",
  "prompt-engineering",
  "context-engineering",
  "rag-knowledge-systems",
];

const SOURCES = [
  { src: "index.html", dest: "index.html" },
  ...GUIDE_SLUGS.map((s) => ({ src: `${s}.html`, dest: `guides-html/${s}.html` })),
  ...CHAPTER_SLUGS.map((s) => ({ src: `${s}.html`, dest: `guides-html/${s}.html` })),
];

function copy() {
  mkdirSync(GUIDES_DIR, { recursive: true });
  for (const { src, dest } of SOURCES) {
    const from = resolve(REPO, src);
    const to = resolve(PUBLIC, dest);
    if (!existsSync(from)) {
      console.warn(`! skip ${src} (not found at ${from})`);
      continue;
    }
    copyFileSync(from, to);
    const size = statSync(to).size;
    console.log(`✓ ${src} → ${dest}  (${(size / 1024).toFixed(1)} KB)`);
  }
  // Clean up stale legacy files (e.g. the old master file).
  const legacy = ["agents-agentic-systems.html"];
  for (const f of legacy) {
    const p = resolve(GUIDES_DIR, f);
    if (existsSync(p)) {
      unlinkSync(p);
      console.log(`✗ removed legacy ${f}`);
    }
  }
}

copy();

if (process.argv.includes("--watch")) {
  console.log("\nwatching parent directory for changes...");
  // Avoid chokidar dep; use fs.watch on the parent dir and re-copy.
  import("node:fs").then(({ watch }) => {
    let pending = null;
    watch(REPO, { recursive: false }, (_event, filename) => {
      if (!filename || !SOURCES.some((s) => s.src === filename)) return;
      clearTimeout(pending);
      pending = setTimeout(() => {
        console.log(`↻ ${filename} changed — recopying`);
        try { copy(); } catch (e) { console.error("copy failed:", e); }
      }, 200);
    });
  });
}
