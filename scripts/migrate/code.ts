import { createHighlighter } from "shiki";
import type { Block } from "../../src/lib/content-schema.ts";

export { extractCode } from "./code-text.ts";

export type Lang = "python" | "sql" | "json" | "bash" | "xml" | "text";
export type Highlight = (code: string, lang: string) => string;

const PYTHON_LINE = /^\s*(def|class|import|from|async def|return|for|if|with)\b/;

function isJson(code: string): boolean {
  try {
    JSON.parse(code);
    return true;
  } catch {
    return false;
  }
}

export function detectLang(code: string): Lang {
  const lines = code.split("\n");
  const first = lines.find((line) => line.trim() !== "") ?? "";
  const trimmed = code.trim();
  if (first.startsWith("--")) return "sql";
  if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && isJson(trimmed)) return "json";
  if (first.startsWith("$ ")) return "bash";
  if (lines.some((line) => PYTHON_LINE.test(line))) return "python";
  if (first.startsWith("<")) return "xml";
  return "text";
}

export async function createHighlight(): Promise<Highlight> {
  const hl = await createHighlighter({
    themes: ["github-dark-dimmed"],
    langs: ["python", "sql", "json", "bash", "xml"],
  });
  return (code, lang) => hl.codeToHtml(code, { lang, theme: "github-dark-dimmed" });
}

export function highlightBlocks(
  blocks: Block[],
  highlight: Highlight,
  langFor: (code: string, index: number) => Lang,
): Block[] {
  let index = 0;
  const walk = (list: Block[]): Block[] => list.map(visit);
  const visit = (block: Block): Block => {
    switch (block.type) {
      case "code": {
        const lang = langFor(block.code, index++);
        return { ...block, lang, html: highlight(block.code, lang) };
      }
      case "callout":
      case "analogy":
        return { ...block, blocks: walk(block.blocks) };
      case "panels":
        return {
          ...block,
          panels: block.panels.map((panel) => ({ ...panel, blocks: walk(panel.blocks) })),
        };
      default:
        return block;
    }
  };
  return walk(blocks);
}
