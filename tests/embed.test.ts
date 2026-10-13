import { test } from "node:test";
import assert from "node:assert/strict";
import { canFrameUrl, httpsHost, isAllowedEmbedUrl, TopicFileSchema } from "../src/lib/content-schema.ts";

const embed = {
  url: "https://playground.tensorflow.org/",
  title: "TensorFlow Playground",
  note: "Press play and watch the loss fall.",
  noteBn: "Play চাপো এবং loss কমতে দেখো।",
};

function fileWith(embeds: unknown) {
  return { slug: "x", title: "X", lede: "L", bn: { title: "X", lede: "L" }, sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", bn: { title: "T", sub: "" }, body: [], layman: [], bangla: [], embeds }] };
}
const parse = (embeds: unknown) => TopicFileSchema.parse(fileWith(embeds));

test("httpsHost reads the host of an https URL only", () => {
  assert.equal(httpsHost("https://apple.github.io/embedding-atlas/app/#?data=x"), "apple.github.io");
  assert.equal(httpsHost("http://apple.github.io/"), null);
  assert.equal(httpsHost("javascript:alert(1)"), null);
  assert.equal(httpsHost("not a url"), null);
});

test("a URL with a fake host in the user part does not pass", () => {
  assert.equal(httpsHost("https://apple.github.io@evil.example/"), "evil.example");
  assert.equal(isAllowedEmbedUrl("https://apple.github.io@evil.example/"), false);
  assert.equal(isAllowedEmbedUrl("https://apple.github.io.evil.example/"), false);
});

test("canFrameUrl: listed hosts frame, Substack hosts do not", () => {
  assert.equal(canFrameUrl("https://poloclub.github.io/transformer-explainer/"), true);
  assert.equal(canFrameUrl("https://newsletter.maartengrootendorst.com/p/x"), false);
  assert.equal(isAllowedEmbedUrl("https://newsletter.maartengrootendorst.com/p/x"), true);
});

test("TopicFileSchema accepts sections with and without embeds", () => {
  assert.doesNotThrow(() => parse([embed]));
  assert.doesNotThrow(() => parse([{ ...embed, autoload: true, height: 700 }]));
  const none = fileWith(undefined);
  delete (none.sections[0] as { embeds?: unknown }).embeds;
  assert.doesNotThrow(() => TopicFileSchema.parse(none));
});

test("a link-only host needs frame: false", () => {
  const blocked = { ...embed, url: "https://newsletter.maartengrootendorst.com/p/a-visual-guide" };
  assert.throws(() => parse([blocked]));
  assert.doesNotThrow(() => parse([{ ...blocked, frame: false }]));
  assert.throws(() => parse([{ ...blocked, frame: false, autoload: true }]));
});

test("TopicFileSchema rejects an unlisted host, a non-https URL, and extra keys", () => {
  for (const url of ["https://evil.example/", "http://playground.tensorflow.org/", "javascript:alert(1)", "data:text/html,x"]) {
    assert.throws(() => parse([{ ...embed, url }]), url);
  }
  assert.throws(() => parse([{ ...embed, sandbox: "none" }]));
});

test("an embed needs a title and a note in both languages, and a sane height", () => {
  for (const key of ["title", "note", "noteBn"] as const) {
    const partial: Record<string, unknown> = { ...embed };
    delete partial[key];
    assert.throws(() => parse([partial]), key);
  }
  assert.throws(() => parse([{ ...embed, noteBn: "  " }]));
  assert.throws(() => parse([{ ...embed, height: 100 }]));
  assert.throws(() => parse([{ ...embed, height: 5000 }]));
});

test("designWidth is optional and must be a sane width", () => {
  assert.doesNotThrow(() => parse([{ ...embed, designWidth: 960 }]));
  assert.throws(() => parse([{ ...embed, designWidth: 100 }]));
  assert.throws(() => parse([{ ...embed, designWidth: 9000 }]));
  assert.throws(() => parse([{ ...embed, designWidth: 960.5 }]));
});

test("an embed note allows only the inline tag allowlist", () => {
  assert.throws(() => parse([{ ...embed, note: "<iframe src=x></iframe>" }]));
});
