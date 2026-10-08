import { HTMLElement, TextNode, parse } from "node-html-parser";
import type { Node } from "node-html-parser";
import { escapePseudoTags } from "./escape.ts";

const KEPT_MARKS = new Set(["strong", "em", "code"]);
const UNWRAPPED = new Set(["span", "small", "sup", "sub", "b", "i", "a"]);

function serializeElement(el: HTMLElement, warnings?: string[]): string {
  const tag = el.tagName.toLowerCase();
  const children = serializeInline(el.childNodes, warnings);
  if (KEPT_MARKS.has(tag)) return `<${tag}>${children}</${tag}>`;
  if (tag === "br") return "<br>";
  if (tag === "a") {
    const href = el.rawAttributes.href ?? "";
    if (el.classList.contains("cite") && /^#src\d+$/.test(href)) {
      return `<a class="cite" href="${href}">${children}</a>`;
    }
    if (/^https?:\/\//.test(href)) return `<a href="${href}">${children}</a>`;
    return children;
  }
  if (!UNWRAPPED.has(tag)) warnings?.push(`unknown inline tag <${tag}>`);
  return children;
}

export function serializeInline(nodes: Node[], warnings?: string[]): string {
  let out = "";
  for (const node of nodes) {
    if (node instanceof TextNode) {
      out += node.rawText.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    } else if (node instanceof HTMLElement) {
      out += serializeElement(node, warnings);
    }
  }
  return out;
}

export function inlineFromHtml(html: string, warnings?: string[]): string {
  const root = parse(escapePseudoTags(html));
  return serializeInline(root.childNodes, warnings).trim();
}
