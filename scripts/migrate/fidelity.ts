import type { Block } from "../../src/lib/content-schema.ts";
import { escapePseudoTags } from "./escape.ts";

// Plain-text views of legacy HTML and of migrated blocks. The migration
// compares the two to prove that no reader-visible text was lost.

const HEAD_DIV = /^\s*<div class="(?:layman|bangla)-head">[\s\S]*?<\/div>/;
const SVG_REGION = /<svg[\s>][\s\S]*?<\/svg>/gi;
const TAG = /<\/?[A-Za-z][^<>]*>/g;
// Block-level tags end a piece of text, so they count as whitespace.
const BLOCK_TAG = /<\/?(?:p|div|li|ul|ol|td|th|tr|thead|tbody|table|h3|h4|pre|hr)\b[^<>]*>/gi;

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&");
}

export function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function inlineText(html: string): string {
  return decodeEntities(html.replace(TAG, ""));
}

export function legacyText(html: string): string {
  const cleaned = escapePseudoTags(html.replace(HEAD_DIV, "").replace(SVG_REGION, ""));
  return collapse(decodeEntities(cleaned.replace(BLOCK_TAG, " ").replace(TAG, "")));
}

function blockPieces(block: Block): string[] {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return [inlineText(block.html)];
    case "list":
      return block.items.map(inlineText);
    case "code":
      return [block.code];
    case "diagram":
      return [block.caption, block.captionBn]
        .filter((c): c is string => c !== undefined)
        .map(inlineText);
    case "callout":
    case "analogy":
      return block.blocks.flatMap(blockPieces);
    case "pillGrid":
      return block.items.flatMap((item) => [inlineText(item.label), inlineText(item.value)]);
    case "table":
      return [...block.headers, ...block.rows.flat()].map(inlineText);
    case "panels":
      return block.panels.flatMap((panel) => [
        inlineText(panel.heading),
        ...panel.blocks.flatMap(blockPieces),
      ]);
    case "divider":
      return [];
    case "html":
      return [inlineText(block.html)];
  }
}

export function blocksText(blocks: Block[]): string {
  return collapse(blocks.flatMap(blockPieces).join(" "));
}

export type Mismatch = { kind: "whitespace" | "text"; at: number; legacy: string; migrated: string };

// Returns null when the texts match. A difference that goes away when all
// whitespace is removed is a block-boundary artifact ("whitespace").
export function compareText(legacy: string, migrated: string): Mismatch | null {
  if (legacy === migrated) return null;
  let at = 0;
  while (at < legacy.length && legacy[at] === migrated[at]) at++;
  const strip = (s: string) => s.replace(/\s+/g, "");
  const kind = strip(legacy) === strip(migrated) ? "whitespace" : "text";
  const from = Math.max(0, at - 40);
  return {
    kind,
    at,
    legacy: legacy.slice(from, at + 60),
    migrated: migrated.slice(from, at + 60),
  };
}
