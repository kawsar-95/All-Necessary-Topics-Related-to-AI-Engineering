// Search index helpers. The route (server) and the palette (client) both
// import this file, and `node --test` loads it directly. Do not import
// topics.ts or zod here.

import MiniSearch from "minisearch";
import type { Block, TopicFile } from "./content-schema.ts";
import type { Lang } from "./i18n.ts";

export type SearchDoc = {
  id: string;
  href: string;
  part: number;
  topic: string;
  title: string;
  text: string;
};

/** A search result: the stored fields of a doc, without the body text. */
export type SearchHit = Omit<SearchDoc, "text">;

/**
 * The plain text of one block. `strip` turns an inline html field into
 * text. Code blocks return their raw source. Diagrams return only captions.
 */
export function blockText(block: Block, strip: (html: string) => string): string {
  const join = (parts: string[]) => parts.filter((part) => part !== "").join(" ");
  const many = (blocks: Block[]) => join(blocks.map((child) => blockText(child, strip)));

  switch (block.type) {
    case "paragraph":
    case "heading":
    case "html":
      return strip(block.html);
    case "list":
      return join(block.items.map(strip));
    case "code":
      return block.code;
    case "diagram":
      return join([block.caption, block.captionBn].map((c) => (c ? strip(c) : "")));
    case "callout":
    case "analogy":
      return many(block.blocks);
    case "pillGrid":
      return join(block.items.flatMap((item) => [strip(item.label), strip(item.value)]));
    case "table":
      return join([...block.headers, ...block.rows.flat()].map(strip));
    case "panels":
      return join(block.panels.map((panel) => join([strip(panel.heading), many(panel.blocks)])));
    case "divider":
      return "";
  }
}

/**
 * One doc per section. English docs use the Technical voice. Bangla docs
 * use the Bangla titles and the বাংলা voice, plus the Technical text, so a
 * search for an English term such as "token" works on the Bangla site too.
 */
export function buildSearchDocs(
  topics: (TopicFile & { part: number })[],
  strip: (html: string) => string,
  lang: Lang = "en",
): SearchDoc[] {
  const bn = lang === "bn";
  return topics.flatMap((topic) =>
    topic.sections.map((section) => {
      const blocks = bn ? [...section.bangla, ...section.body] : section.body;
      return {
        id: `${topic.slug}#${section.id}`,
        href: `${bn ? "/bn" : ""}/topics/${topic.slug}#${section.id}`,
        part: topic.part,
        topic: bn ? topic.bn.title : topic.title,
        title: bn ? section.bn.title : section.title,
        text: [strip(bn ? section.bn.sub : section.sub), ...blocks.map((block) => blockText(block, strip))]
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      };
    }),
  );
}

const SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  boost: { title: 3, topic: 1.5 },
};

export function createIndex(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const index = new MiniSearch<SearchDoc>({
    fields: ["title", "topic", "text"],
    storeFields: ["href", "part", "topic", "title"],
    searchOptions: SEARCH_OPTIONS,
  });
  index.addAll(docs);
  return index;
}

export function runSearch(index: MiniSearch<SearchDoc>, query: string, limit = 8): SearchHit[] {
  if (query.trim() === "") return [];
  return index.search(query).slice(0, limit).map((hit) => ({
    id: String(hit.id),
    href: hit.href as string,
    part: hit.part as number,
    topic: hit.topic as string,
    title: hit.title as string,
  }));
}
