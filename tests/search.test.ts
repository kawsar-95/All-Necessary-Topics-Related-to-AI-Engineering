import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block, TopicFile } from "../src/lib/content-schema.ts";
import { blockText, buildSearchDocs, createIndex, runSearch } from "../src/lib/search.ts";

const strip = (h: string) => h.replace(/<[^>]+>/g, "");

const topics: (TopicFile & { part: number })[] = [
  {
    part: 4,
    slug: "rag",
    title: "RAG",
    lede: "",
    bn: { title: "RAG (বাংলা)", lede: "" },
    sources: [],
    sections: [
      {
        id: "s7",
        num: "07",
        title: "Reranking: Cohere, BGE, Voyage",
        sub: "Cross-encoders",
        bn: { title: "Reranking (বাংলা)", sub: "Cross-encoder" },
        layman: [],
        bangla: [{ type: "paragraph", html: "সহজ ব্যাখ্যা" }],
        body: [
          {
            type: "callout",
            variant: "info",
            blocks: [{ type: "paragraph", html: "<strong>BM25</strong> first" }],
          },
        ],
      },
    ],
  },
];

test("buildSearchDocs makes one doc per section with nested text", () => {
  const docs = buildSearchDocs(topics, strip);
  assert.deepEqual(docs[0], {
    id: "rag#s7",
    href: "/topics/rag#s7",
    part: 4,
    topic: "RAG",
    title: "Reranking: Cohere, BGE, Voyage",
    text: "Cross-encoders BM25 first",
  });
});

test("runSearch finds by prefix and ignores blank queries", () => {
  const idx = createIndex(buildSearchDocs(topics, strip));
  assert.equal(runSearch(idx, "rerank")[0].id, "rag#s7");
  assert.deepEqual(runSearch(idx, "   "), []);
});

test("runSearch hits carry the stored fields and no text", () => {
  const idx = createIndex(buildSearchDocs(topics, strip));
  assert.deepEqual(runSearch(idx, "bm25")[0], {
    id: "rag#s7",
    href: "/topics/rag#s7",
    part: 4,
    topic: "RAG",
    title: "Reranking: Cohere, BGE, Voyage",
  });
});

test("blockText reads every block type", () => {
  const p = (html: string): Block => ({ type: "paragraph", html });
  const cases: [Block, string][] = [
    [p("<em>a</em>"), "a"],
    [{ type: "heading", level: 3, id: "h", html: "<code>H</code>" }, "H"],
    [{ type: "list", ordered: false, items: ["<b>x</b>", "y"] }, "x y"],
    [{ type: "code", lang: "ts", code: "a < b", html: "<span>a</span>" }, "a < b"],
    [{ type: "diagram", svg: "<svg>noise</svg>", caption: "<em>Cap</em>", captionBn: "ক্যাপ" }, "Cap ক্যাপ"],
    [{ type: "diagram", svg: "<svg>noise</svg>" }, ""],
    [{ type: "analogy", blocks: [p("one"), p("two")] }, "one two"],
    [{ type: "pillGrid", items: [{ label: "<b>L</b>", value: "V" }] }, "L V"],
    [{ type: "table", headers: ["H1", "H2"], rows: [["a", "<i>b</i>"]] }, "H1 H2 a b"],
    [{ type: "panels", panels: [{ heading: "<b>PH</b>", blocks: [p("pb")] }] }, "PH pb"],
    [{ type: "divider" }, ""],
    [{ type: "html", html: "<div>raw</div>" }, "raw"],
  ];
  for (const [block, want] of cases) {
    assert.equal(blockText(block, strip).replace(/\s+/g, " ").trim(), want, block.type);
  }
});

test("buildSearchDocs in Bangla: Bangla titles, /bn links, Bangla and Technical text", () => {
  const [doc] = buildSearchDocs(topics, strip, "bn");
  assert.equal(doc.href, "/bn/topics/rag#s7");
  assert.equal(doc.topic, "RAG (বাংলা)");
  assert.equal(doc.title, "Reranking (বাংলা)");
  assert.match(doc.text, /^Cross-encoder সহজ ব্যাখ্যা BM25 first$/);
});
