import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block } from "../src/lib/content-schema.ts";
import { parseBlocks, slugify } from "../scripts/migrate/blocks.ts";
import type { ParseContext } from "../scripts/migrate/blocks.ts";
import { extractCode } from "../scripts/migrate/code-text.ts";

function ctx(sectionId = "s1"): ParseContext {
  return { where: "test", warnings: [], headingIds: new Set<string>(), sectionId };
}

test("skips whitespace-only text", () => {
  assert.deepEqual(parseBlocks("  \n  <p>a</p>\n  ", ctx()), [{ type: "paragraph", html: "a" }]);
});

test("groups a bare inline run into one trimmed paragraph", () => {
  const b = parseBlocks("  <strong>A</strong> and <em>b</em> <span>c</span>  <h3>T</h3>", ctx());
  assert.deepEqual(b[0], { type: "paragraph", html: "<strong>A</strong> and <em>b</em> c" });
  assert.equal(b[1].type, "heading");
});

test("flushes a trailing inline run at the end", () => {
  assert.deepEqual(parseBlocks("<hr>tail text", ctx()), [
    { type: "divider" },
    { type: "paragraph", html: "tail text" },
  ]);
});

test("an unknown tag is escaped as text and joins the inline run", () => {
  const c = ctx();
  const b = parseBlocks("<blink>x</blink>", c);
  assert.deepEqual(b, [{ type: "paragraph", html: "&lt;blink&gt;x&lt;/blink&gt;" }]);
  assert.equal(c.warnings.length, 0);
});

test("p becomes a paragraph and an empty p is skipped", () => {
  const b = parseBlocks('<p>A <strong>b</strong> <a class="cite" href="#src3">[3]</a></p><p>  </p>', ctx());
  assert.deepEqual(b, [{ type: "paragraph", html: 'A <strong>b</strong> <a class="cite" href="#src3">[3]</a>' }]);
});

test("p keeps br line breaks", () => {
  assert.deepEqual(parseBlocks("<p>a<br>b</p>", ctx()), [{ type: "paragraph", html: "a<br>b" }]);
});

test("h3 and h4 become headings with ids", () => {
  const b = parseBlocks("<h3>Agent vs <em>workflow</em></h3><h4>Sub part</h4>", ctx("s2"));
  assert.deepEqual(b, [
    { type: "heading", level: 3, id: "s2-agent-vs-workflow", html: "Agent vs <em>workflow</em>" },
    { type: "heading", level: 4, id: "s2-sub-part", html: "Sub part" },
  ]);
});

test("ul becomes an unordered list", () => {
  const b = parseBlocks('<ul style="margin: 0 0 14px 20px;"><li><strong>A</strong> one</li>\n<li>two</li></ul>', ctx());
  assert.deepEqual(b, [{ type: "list", ordered: false, items: ["<strong>A</strong> one", "two"] }]);
});

test("ol becomes an ordered list", () => {
  assert.deepEqual(parseBlocks("<ol><li>a</li><li>b</li></ol>", ctx()), [
    { type: "list", ordered: true, items: ["a", "b"] },
  ]);
});

for (const inner of ["<ul><li>x</li></ul>", "<pre>x</pre>", "<table></table>", "<div>x</div>", "<p>x</p>"]) {
  test(`list with li containing ${inner} falls back to one html block`, () => {
    const c = ctx();
    const b = parseBlocks(`<ul><li>a ${inner}</li><li>b</li></ul>`, c);
    assert.equal(b.length, 1);
    assert.equal(b[0].type, "html");
    assert.ok((b[0] as Extract<Block, { type: "html" }>).html.startsWith("<ul>"));
    assert.equal(c.warnings.length, 1);
    assert.ok(c.warnings[0].startsWith("test: fallback"));
  });
}

test("flat list does not warn", () => {
  const c = ctx();
  parseBlocks("<ul><li>a <code>x</code></li></ul>", c);
  assert.equal(c.warnings.length, 0);
});

test("pre becomes a code block with extracted code", () => {
  const html = '<pre><code><span class="com"># c</span>\n<span class="kw">def</span> f(): <span class="str">"&lt;a&gt;"</span>\n</code></pre>';
  assert.deepEqual(parseBlocks(html, ctx()), [
    { type: "code", lang: "", code: '# c\ndef f(): "<a>"', html: "" },
  ]);
});

test("pre without code element works", () => {
  assert.deepEqual(parseBlocks("<pre>a &amp; b</pre>", ctx()), [
    { type: "code", lang: "", code: "a & b", html: "" },
  ]);
});

test("pre keeps pseudo-tags as text", () => {
  const b = parseBlocks("<pre><code><document>x</document></code></pre>", ctx());
  assert.deepEqual(b, [{ type: "code", lang: "", code: "<document>x</document>", html: "" }]);
});

test("table becomes headers and rows", () => {
  const html =
    "<table><thead><tr><th>Loop</th><th>Use</th></tr></thead><tbody>" +
    "<tr><td><strong>ReAct</strong></td><td>a</td></tr><tr><td>b</td><td>c</td></tr></tbody></table>";
  assert.deepEqual(parseBlocks(html, ctx()), [
    { type: "table", headers: ["Loop", "Use"], rows: [["<strong>ReAct</strong>", "a"], ["b", "c"]] },
  ]);
});

test("table without th has empty headers", () => {
  assert.deepEqual(parseBlocks("<table><tr><td>a</td></tr></table>", ctx()), [
    { type: "table", headers: [], rows: [["a"]] },
  ]);
});

test("hr becomes a divider", () => {
  assert.deepEqual(parseBlocks("<hr>", ctx()), [{ type: "divider" }]);
});

test("diagram keeps svg and both captions", () => {
  const html =
    '<div class="diagram"><svg viewBox="0 0 1 1"><text x="0">a</text></svg>' +
    '<div class="diagram-caption">Cap <em>e</em></div>' +
    '<div class="diagram-caption diagram-caption-bn">বাংলা</div></div>';
  assert.deepEqual(parseBlocks(html, ctx()), [
    {
      type: "diagram",
      svg: '<svg viewBox="0 0 1 1"><text x="0">a</text></svg>',
      caption: "Cap <em>e</em>",
      captionBn: "বাংলা",
    },
  ]);
});

test("diagram omits absent captions", () => {
  const b = parseBlocks('<div class="diagram"><svg></svg></div>', ctx());
  assert.deepEqual(b, [{ type: "diagram", svg: "<svg></svg>" }]);
});

test("callout picks its variant", () => {
  const cases: [string, string][] = [
    ["callout", "info"],
    ["callout good", "good"],
    ["callout warn", "warn"],
    ["callout danger", "danger"],
    ["callout pink", "pink"],
  ];
  for (const [cls, variant] of cases) {
    const b = parseBlocks(`<div class="${cls}"><p>x</p></div>`, ctx());
    assert.deepEqual(b, [{ type: "callout", variant, blocks: [{ type: "paragraph", html: "x" }] }]);
  }
});

test("callout can hold nested code and table", () => {
  const b = parseBlocks('<div class="callout"><pre>a</pre><table><tr><td>1</td></tr></table></div>', ctx());
  const callout = b[0] as Extract<Block, { type: "callout" }>;
  assert.deepEqual(callout.blocks.map((x) => x.type), ["code", "table"]);
});

test("analogy recurses into blocks", () => {
  const b = parseBlocks('<div class="analogy"><strong>The analogy:</strong> like a cat.</div>', ctx());
  assert.deepEqual(b, [
    { type: "analogy", blocks: [{ type: "paragraph", html: "<strong>The analogy:</strong> like a cat." }] },
  ]);
});

test("pill-grid becomes pillGrid", () => {
  const html =
    '<div class="pill-grid"><div class="pill"><div class="label">GPT-4 Turbo</div><div class="val">128K <em>tokens</em></div></div>' +
    '<div class="pill"><div class="label">B</div><div class="val">2</div></div></div>';
  assert.deepEqual(parseBlocks(html, ctx()), [
    {
      type: "pillGrid",
      items: [
        { label: "GPT-4 Turbo", value: "128K <em>tokens</em>" },
        { label: "B", value: "2" },
      ],
    },
  ]);
});

test("two-col becomes panels", () => {
  const html =
    '<div class="two-col"><div class="panel"><h4>vLLM</h4><p>fast <a class="cite" href="#src13">[13]</a></p></div>' +
    '<div class="panel"><h4>TGI</h4><ul><li>a</li></ul></div></div>';
  assert.deepEqual(parseBlocks(html, ctx()), [
    {
      type: "panels",
      panels: [
        { heading: "vLLM", blocks: [{ type: "paragraph", html: 'fast <a class="cite" href="#src13">[13]</a>' }] },
        { heading: "TGI", blocks: [{ type: "list", ordered: false, items: ["a"] }] },
      ],
    },
  ]);
});

test("drops the bangla head", () => {
  const b = parseBlocks('<div class="bangla-head"><span class="label">x</span></div><p>Hi</p>', ctx());
  assert.deepEqual(b, [{ type: "paragraph", html: "Hi" }]);
});

test("stray li becomes an html block with a warning", () => {
  const c = ctx();
  const b = parseBlocks("<li>x</li>", c);
  assert.deepEqual(b, [{ type: "html", html: "<li>x</li>" }]);
  assert.deepEqual(c.warnings, ["test: fallback li"]);
});

test("groups a bare inline run inside a callout into one paragraph", () => {
  const b = parseBlocks('<div class="callout good"><strong>Rule:</strong> text <em>x</em><ul><li>a</li></ul></div>', ctx());
  assert.deepEqual(b, [{ type: "callout", variant: "good", blocks: [
    { type: "paragraph", html: "<strong>Rule:</strong> text <em>x</em>" },
    { type: "list", ordered: false, items: ["a"] } ] }]);
});

test("drops the layman head", () => {
  const b = parseBlocks('<div class="layman-head"><span class="icon">🤖</span><span class="label">L<small>s</small></span></div><p>Hi</p>', ctx());
  assert.deepEqual(b, [{ type: "paragraph", html: "Hi" }]);
});

test("heading ids are unique per context", () => {
  const c = ctx("s2");
  const b = parseBlocks("<h3>Frameworks</h3><h3>Frameworks</h3><h3>বাংলা</h3>", c);
  assert.deepEqual(b.map(x => (x as { id: string }).id), ["s2-frameworks", "s2-frameworks-2", "s2-h3"]);
});

test("heading ids stay unique across calls sharing a context", () => {
  const c = ctx("s1");
  parseBlocks("<h3>Same</h3>", c);
  const b = parseBlocks("<h3>Same</h3><h3>Same</h3>", c);
  assert.deepEqual(b.map((x) => (x as { id: string }).id), ["s1-same-2", "s1-same-3"]);
});

test("slugify lowercases, strips tags, and cuts to 60", () => {
  assert.equal(slugify("<em>Hello</em>, World!"), "hello-world");
  assert.equal(slugify("বাংলা"), "");
  assert.equal(slugify("a".repeat(80)).length, 60);
});

test("unknown div becomes an html block with a warning", () => {
  const c = ctx();
  const b = parseBlocks('<div class="mystery">x</div>', c);
  assert.equal(b[0].type, "html");
  assert.equal(c.warnings.length, 1);
  assert.equal(c.warnings[0], "test: fallback div.mystery");
});

test("inline warnings carry the location prefix", () => {
  const c = ctx();
  parseBlocks("<table><tr><td><p>x</p></td></tr></table>", c);
  assert.deepEqual(c.warnings, ["test: unknown inline tag <p>"]);
});

test("inline warnings from a bare run carry the location prefix", () => {
  const c = ctx();
  parseBlocks("<span><p>x</p></span>", c);
  assert.ok(c.warnings.length > 0);
  assert.ok(c.warnings.every((w) => w.startsWith("test: ")));
});

test("extractCode keeps pseudo-tags and strips highlight spans", () => {
  assert.equal(extractCode('<span class="kw">def</span> f(): return <span class="str">"&lt;document&gt;"</span>'), 'def f(): return "<document>"');
});

test("sibling panels without a two-col wrapper group into one panels block", () => {
  const c = ctx();
  const b = parseBlocks(
    '</div>\n  <div class="panel"><h4>A</h4><p>a</p></div>\n  <div class="panel"><h4>B</h4><p>b</p></div>\n</div>' +
      '<p>after</p><div class="panel"><h4>C</h4></div>',
    c,
  );
  assert.deepEqual(b, [
    {
      type: "panels",
      panels: [
        { heading: "A", blocks: [{ type: "paragraph", html: "a" }] },
        { heading: "B", blocks: [{ type: "paragraph", html: "b" }] },
      ],
    },
    { type: "paragraph", html: "after" },
    { type: "panels", panels: [{ heading: "C", blocks: [] }] },
  ]);
  assert.deepEqual(c.warnings, []);
});

test("extractCode decodes entities with amp last and trims one newline each side", () => {
  assert.equal(extractCode("\n\na &amp;lt; &#39;b&#39; &quot;c&quot;\n\n"), "\na &lt; 'b' \"c\"\n");
});
