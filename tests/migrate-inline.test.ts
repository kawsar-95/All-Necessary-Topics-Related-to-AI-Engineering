import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "node-html-parser";
import { escapePseudoTags } from "../scripts/migrate/escape.ts";
import { inlineFromHtml, serializeInline } from "../scripts/migrate/inline.ts";
import { isAllowedInline } from "../src/lib/content-schema.ts";

test("escapes pseudo-tags in prose", () => {
  assert.equal(
    inlineFromHtml("wrap in <code><document>…</document></code> tags"),
    "wrap in <code>&lt;document&gt;…&lt;/document&gt;</code> tags",
  );
});

test("escapes an unclosed pseudo-tag", () => {
  assert.equal(
    inlineFromHtml("use <code><document></code> here"),
    "use <code>&lt;document&gt;</code> here",
  );
});

test("escapes pseudo-tags with spaces", () => {
  assert.equal(escapePseudoTags("<the user's question>"), "&lt;the user's question&gt;");
});

test("keeps svg internals", () => {
  const svg = '<svg viewBox="0 0 1 1"><text x="0">a</text><marker id="m"/></svg>';
  assert.equal(escapePseudoTags(svg), svg);
});

test("keeps allowlisted marks and drops attributes", () => {
  assert.equal(
    inlineFromHtml(
      '<strong style="x">A</strong> <a class="cite" href="#src3">[3]</a> <span class="kw">k</span>',
    ),
    '<strong>A</strong> <a class="cite" href="#src3">[3]</a> k',
  );
});

test("keeps br", () => {
  assert.equal(inlineFromHtml("1. a<br>\n2. b"), "1. a<br>\n2. b");
});

test("output passes isAllowedInline", () => {
  assert.equal(
    isAllowedInline(inlineFromHtml('x <document>y</document> <a href="https://a.b">l</a>')),
    true,
  );
});

test("escapes a bare < in text", () => {
  assert.equal(inlineFromHtml("often <3% quality hit"), "often &lt;3% quality hit");
});

test("escapes > in text", () => {
  assert.equal(inlineFromHtml("a -> b"), "a -&gt; b");
});

test("keeps existing entities unchanged", () => {
  assert.equal(inlineFromHtml("x &lt;y&gt; z &amp; w"), "x &lt;y&gt; z &amp; w");
});

test("keeps an external link and unwraps other links", () => {
  assert.equal(
    inlineFromHtml('<a href="https://a.b/c" target="_blank">x</a> <a href="/rel">y</a>'),
    '<a href="https://a.b/c">x</a> y',
  );
});

test("pushes a warning for an unknown element", () => {
  const warnings: string[] = [];
  const out = serializeInline(parse("a <div>b</div> c").childNodes, warnings);
  assert.equal(out, "a b c");
  assert.deepEqual(warnings, ["unknown inline tag <div>"]);
});
