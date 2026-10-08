import { HTMLElement } from "node-html-parser";
import type { Node } from "node-html-parser";

export type SectionParts = { sub: string; body: string; layman: string; bangla: string };

function hasClass(node: Node, tag: string, cls: string): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    node.tagName.toLowerCase() === tag &&
    node.classList.contains(cls)
  );
}

function serialize(node: Node): string {
  return node instanceof HTMLElement ? node.outerHTML : node.rawText;
}

// Splits <section id="sN"> of an original guide page into its four parts:
// sub = p.sub, body = everything between p.sub and aside.layman (without
// div.section-head), layman = aside.layman, bangla = aside.bangla.
// Throws when the section or one of its parts is missing.
export function extractSection(root: HTMLElement, id: string, where: string): SectionParts {
  const section = root
    .querySelectorAll("section")
    .find((el) => el.getAttribute("id") === id);
  if (!section) throw new Error(`${where}: <section id="${id}"> not found`);
  const kids = section.childNodes;
  const subIndex = kids.findIndex((n) => hasClass(n, "p", "sub"));
  const laymanIndex = kids.findIndex((n) => hasClass(n, "aside", "layman"));
  const banglaIndex = kids.findIndex((n) => hasClass(n, "aside", "bangla"));
  if (subIndex < 0 || laymanIndex < 0 || banglaIndex < 0) {
    throw new Error(`${where}: section ${id} lacks p.sub, aside.layman, or aside.bangla`);
  }
  if (!(subIndex < laymanIndex && laymanIndex < banglaIndex)) {
    throw new Error(`${where}: section ${id} parts are out of order`);
  }
  const body = kids
    .slice(subIndex + 1, laymanIndex)
    .filter((n) => !hasClass(n, "div", "section-head"))
    .map(serialize)
    .join("");
  return {
    sub: (kids[subIndex] as HTMLElement).innerHTML,
    body,
    layman: (kids[laymanIndex] as HTMLElement).innerHTML,
    bangla: (kids[banglaIndex] as HTMLElement).innerHTML,
  };
}
