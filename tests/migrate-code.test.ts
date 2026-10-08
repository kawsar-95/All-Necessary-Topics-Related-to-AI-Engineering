import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block } from "../src/lib/content-schema.ts";
import { createHighlight, detectLang, highlightBlocks } from "../scripts/migrate/code.ts";

type CodeBlock = Extract<Block, { type: "code" }>;
type CalloutBlock = Extract<Block, { type: "callout" }>;
type AnalogyBlock = Extract<Block, { type: "analogy" }>;
type PanelsBlock = Extract<Block, { type: "panels" }>;

test("detectLang", () => {
  assert.equal(detectLang("-- pgvector\nCREATE INDEX"), "sql");
  assert.equal(detectLang('{"a": 1}'), "json");
  assert.equal(detectLang("# The minimal agent\ndef agent_loop():\n  pass"), "python");
  assert.equal(detectLang("<system>\nrules\n</system>"), "xml");
  assert.equal(detectLang("Thought: x\nAction: y"), "text");
});

test("detectLang applies the rules in order", () => {
  assert.equal(detectLang("\n\n-- c\ndef f(): pass"), "sql");
  assert.equal(detectLang("[not json]"), "text");
  assert.equal(detectLang("[1, 2]"), "json");
  assert.equal(detectLang("$ pip install x\nimport y"), "bash");
  assert.equal(detectLang("<a>\nimport x"), "python");
});

test("highlightBlocks fills nested code blocks in order", () => {
  const seen: string[] = [];
  const out = highlightBlocks(
    [
      { type: "code", lang: "", code: "a", html: "" },
      { type: "callout", variant: "info", blocks: [{ type: "code", lang: "", code: "b", html: "" }] },
    ],
    (c, l) => `<pre>${c}:${l}</pre>`,
    (c, i) => {
      seen.push(`${c}${i}`);
      return "text";
    },
  );
  assert.deepEqual(seen, ["a0", "b1"]);
  const inner = (out[1] as CalloutBlock).blocks[0] as CodeBlock;
  assert.equal(inner.html, "<pre>b:text</pre>");
  assert.equal(inner.lang, "text");
});

test("highlightBlocks reaches analogy and panels without mutating the input", () => {
  const input: Block[] = [
    { type: "analogy", blocks: [{ type: "code", lang: "", code: "a", html: "" }] },
    {
      type: "panels",
      panels: [
        { heading: "h1", blocks: [{ type: "code", lang: "", code: "b", html: "" }] },
        {
          heading: "h2",
          blocks: [
            { type: "paragraph", html: "p" },
            { type: "code", lang: "", code: "c", html: "" },
          ],
        },
      ],
    },
  ];
  const snapshot = structuredClone(input);
  const out = highlightBlocks(
    input,
    (c) => `<${c}>`,
    (_c, i) => (i === 0 ? "python" : "text"),
  );
  assert.deepEqual(input, snapshot);
  const analogy = out[0] as AnalogyBlock;
  assert.deepEqual(analogy.blocks[0], { type: "code", lang: "python", code: "a", html: "<a>" });
  const panels = (out[1] as PanelsBlock).panels;
  assert.deepEqual(panels[0].blocks[0], { type: "code", lang: "text", code: "b", html: "<b>" });
  assert.deepEqual(panels[1].blocks[1], { type: "code", lang: "text", code: "c", html: "<c>" });
  assert.deepEqual(panels[1].blocks[0], { type: "paragraph", html: "p" });
});

test("shiki output keeps a literal pseudo-tag visible", async () => {
  const hl = await createHighlight();
  const html = hl('x = "<document>"', "python");
  assert.match(html, /&lt;document&gt;|&#x3C;document>/);
  assert.match(hl("plain <x>", "text"), /<pre/);
});
