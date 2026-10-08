import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedInline, TopicFileSchema } from "../src/lib/content-schema.ts";

test("isAllowedInline accepts the allowlist", () => {
  assert.equal(isAllowedInline('a <strong>b</strong> <em>c</em> <code>d</code><br> <a class="cite" href="#src12">[12]</a> <a href="https://arxiv.org/abs/1">x</a>'), true);
});

test("isAllowedInline rejects other tags and attributes", () => {
  for (const bad of ['<div>x</div>', '<span class="kw">x</span>', '<strong style="color:red">x</strong>', '<a href="javascript:alert(1)">x</a>', '<a class="cite" href="#foo">x</a>', '<img src=x>']) {
    assert.equal(isAllowedInline(bad), false, bad);
  }
});

test("isAllowedInline accepts escaped pseudo-tags", () => {
  assert.equal(isAllowedInline("wrap in <code>&lt;document&gt;</code>"), true);
});

test("TopicFileSchema accepts nested callout blocks", () => {
  const file = { slug: "x", title: "X", lede: "L", bn: { title: "X", lede: "L" }, sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", bn: { title: "T", sub: "" }, layman: [], bangla: [],
    body: [{ type: "callout", variant: "pink", blocks: [{ type: "list", ordered: false, items: ["a"] }] }] }] };
  assert.deepEqual(TopicFileSchema.parse(file), file);
});

test("TopicFileSchema rejects unknown block types and bad variants", () => {
  const base = { slug: "x", title: "X", lede: "L", bn: { title: "X", lede: "L" }, sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", bn: { title: "T", sub: "" }, layman: [], bangla: [], body: [] as unknown[] }] };
  base.sections[0].body = [{ type: "aside", html: "x" }];
  assert.throws(() => TopicFileSchema.parse(base));
  base.sections[0].body = [{ type: "callout", variant: "blue", blocks: [] }];
  assert.throws(() => TopicFileSchema.parse(base));
});

test("TopicFileSchema rejects an unknown key on a section", () => {
  const file = { slug: "x", title: "X", lede: "L", bn: { title: "X", lede: "L" }, sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", bn: { title: "T", sub: "" }, layman: [], bangla: [], body: [], tag_line: "oops" }] };
  assert.throws(() => TopicFileSchema.parse(file));
});

test("TopicFileSchema rejects caption_bn on a diagram block", () => {
  const file = { slug: "x", title: "X", lede: "L", bn: { title: "X", lede: "L" }, sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", bn: { title: "T", sub: "" }, layman: [], bangla: [],
    body: [{ type: "diagram", svg: "<svg/>", caption_bn: "oops" }] }] };
  assert.throws(() => TopicFileSchema.parse(file));
});
