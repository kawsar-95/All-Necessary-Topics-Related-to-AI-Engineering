import { HTMLElement, TextNode, parse } from "node-html-parser";
import type { Node } from "node-html-parser";
import type { Block, CalloutVariant } from "../../src/lib/content-schema.ts";
import { extractCode } from "./code-text.ts";
import { escapePseudoTags } from "./escape.ts";
import { serializeInline } from "./inline.ts";

export type ParseContext = {
  where: string;
  warnings: string[];
  headingIds: Set<string>;
  sectionId: string;
};

const VARIANTS = ["good", "warn", "danger", "pink"] as const;
const NESTED_IN_LI = "ul, ol, pre, table, div, p";
const BLOCK_TAGS = new Set([
  "li", "div", "h1", "h2", "h5", "h6", "blockquote", "section", "figure",
  "thead", "tbody", "tfoot", "tr", "td", "th", "svg", "img", "dl", "dt", "dd",
]);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

function headingId(text: string, ctx: ParseContext): string {
  const slug = slugify(text) || `h${ctx.headingIds.size + 1}`;
  const base = `${ctx.sectionId}-${slug}`;
  let id = base;
  for (let n = 2; ctx.headingIds.has(id); n++) id = `${base}-${n}`;
  ctx.headingIds.add(id);
  return id;
}

function inline(el: HTMLElement | null | undefined, ctx: ParseContext): string {
  return el ? serializeInline(el.childNodes, ctx.warnings).trim() : "";
}

function fallback(el: HTMLElement, ctx: ParseContext): Block {
  const tag = el.tagName.toLowerCase();
  const cls = el.classList.value.join(".");
  ctx.warnings.push(`${ctx.where}: fallback ${cls ? `${tag}.${cls}` : tag}`);
  return { type: "html", html: el.outerHTML };
}

function listBlock(el: HTMLElement, ctx: ParseContext): Block {
  const items = el.querySelectorAll("li");
  if (items.some((li) => li.querySelector(NESTED_IN_LI))) return fallback(el, ctx);
  return {
    type: "list",
    ordered: el.tagName.toLowerCase() === "ol",
    items: items.map((li) => inline(li, ctx)),
  };
}

function tableBlock(el: HTMLElement, ctx: ParseContext): Block {
  const rows = el.querySelectorAll("tr");
  const headerRow = rows.find((tr) => tr.querySelector("th"));
  const cells = (tr: HTMLElement, tag: string) =>
    tr.querySelectorAll(tag).map((cell) => inline(cell, ctx));
  return {
    type: "table",
    headers: headerRow ? cells(headerRow, "th") : [],
    rows: rows.filter((tr) => tr !== headerRow).map((tr) => cells(tr, "td")),
  };
}

function diagramBlock(el: HTMLElement, ctx: ParseContext): Block {
  const svg = el.querySelector("svg");
  if (!svg) return fallback(el, ctx);
  const captions = el.querySelectorAll(".diagram-caption");
  const en = captions.find((c) => !c.classList.contains("diagram-caption-bn"));
  const bn = captions.find((c) => c.classList.contains("diagram-caption-bn"));
  return {
    type: "diagram",
    svg: svg.outerHTML,
    ...(en ? { caption: inline(en, ctx) } : {}),
    ...(bn ? { captionBn: inline(bn, ctx) } : {}),
  };
}

function panelsBlock(el: HTMLElement, ctx: ParseContext): Block {
  const panels = el.childNodes
    .filter((n): n is HTMLElement => n instanceof HTMLElement && n.classList.contains("panel"))
    .map((panel) => {
      const h4 = panel.querySelector("h4");
      return {
        heading: inline(h4, ctx),
        blocks: parseNodes(panel.childNodes.filter((n) => n !== h4), ctx),
      };
    });
  return { type: "panels", panels };
}

function divBlock(el: HTMLElement, ctx: ParseContext): Block | null {
  const has = (c: string) => el.classList.contains(c);
  if (has("diagram")) return diagramBlock(el, ctx);
  if (has("callout")) {
    const variant = el.classList.value.find((c): c is CalloutVariant =>
      (VARIANTS as readonly string[]).includes(c),
    );
    return { type: "callout", variant: variant ?? "info", blocks: parseNodes(el.childNodes, ctx) };
  }
  if (has("analogy")) return { type: "analogy", blocks: parseNodes(el.childNodes, ctx) };
  if (has("pill-grid")) {
    const items = el.querySelectorAll(".pill").map((pill) => ({
      label: inline(pill.querySelector(".label"), ctx),
      value: inline(pill.querySelector(".val"), ctx),
    }));
    return { type: "pillGrid", items };
  }
  if (has("two-col")) return panelsBlock(el, ctx);
  if (has("layman-head") || has("bangla-head")) return null;
  return fallback(el, ctx);
}

function elementBlock(el: HTMLElement, ctx: ParseContext): Block | null {
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "p": {
      const html = inline(el, ctx);
      return html ? { type: "paragraph", html } : null;
    }
    case "h3":
    case "h4": {
      const html = inline(el, ctx);
      return { type: "heading", level: tag === "h3" ? 3 : 4, id: headingId(html, ctx), html };
    }
    case "ul":
    case "ol":
      return listBlock(el, ctx);
    case "pre": {
      const inner = el.innerHTML;
      const wrapped = /^\s*<code\b[^>]*>([\s\S]*)<\/code>\s*$/i.exec(inner);
      const code = extractCode(wrapped ? wrapped[1] : inner);
      return { type: "code", lang: "", code, html: "" };
    }
    case "table":
      return tableBlock(el, ctx);
    case "hr":
      return { type: "divider" };
    case "div":
      return divBlock(el, ctx);
    default:
      return fallback(el, ctx);
  }
}

export function parseNodes(nodes: Node[], ctx: ParseContext): Block[] {
  const blocks: Block[] = [];
  let run: Node[] = [];
  const flush = () => {
    const html = serializeInline(run, ctx.warnings).trim();
    if (html) blocks.push({ type: "paragraph", html });
    run = [];
  };
  for (const node of nodes) {
    if (node instanceof TextNode) {
      if (run.length > 0 || node.rawText.trim() !== "") run.push(node);
      continue;
    }
    if (!(node instanceof HTMLElement)) continue;
    const tag = node.tagName.toLowerCase();
    if (!BLOCK_TAGS.has(tag) && !/^(p|h3|h4|ul|ol|pre|table|hr)$/.test(tag)) {
      run.push(node);
      continue;
    }
    flush();
    const block = elementBlock(node, ctx);
    if (block) blocks.push(block);
  }
  flush();
  return blocks;
}

export function parseBlocks(html: string, ctx: ParseContext): Block[] {
  return parseNodes(parse(escapePseudoTags(html)).childNodes, ctx);
}
