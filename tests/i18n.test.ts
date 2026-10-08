import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { LANG_STORAGE_KEY, UI, fmtNum, langFromPath, langInitScript, localizedPath } from "../src/lib/i18n.ts";
import { practiceLang } from "../src/lib/practice.ts";
import { videosForVoice } from "../src/lib/videos.ts";
import type { Video } from "../src/lib/content-schema.ts";

test("langFromPath: /bn and /bn/... are Bangla, everything else English", () => {
  assert.equal(langFromPath("/bn"), "bn");
  assert.equal(langFromPath("/bn/"), "bn");
  assert.equal(langFromPath("/bn/topics/inference/"), "bn");
  assert.equal(langFromPath("/"), "en");
  assert.equal(langFromPath("/topics/inference/"), "en");
  assert.equal(langFromPath("/bnx/"), "en");
  assert.equal(langFromPath("/topics/bn/"), "en");
});

test("localizedPath maps a page to the same page in the other language", () => {
  assert.equal(localizedPath("/", "bn"), "/bn/");
  assert.equal(localizedPath("/topics/inference/", "bn"), "/bn/topics/inference/");
  assert.equal(localizedPath("/bn/", "en"), "/");
  assert.equal(localizedPath("/bn", "en"), "/");
  assert.equal(localizedPath("/bn/topics/inference/", "en"), "/topics/inference/");
  assert.equal(localizedPath("/bn/topics/inference/", "bn"), "/bn/topics/inference/");
  assert.equal(localizedPath("/topics/inference/", "en"), "/topics/inference/");
});

/** Runs the head script against a fake browser. */
function runInit(path: string, stored: string | null, base = "/repo") {
  const attrs: Record<string, string> = {};
  let replaced: string | null = null;
  const context = {
    localStorage: { getItem: (k: string) => (k === LANG_STORAGE_KEY ? stored : null) },
    location: {
      pathname: base + path,
      search: "?q=1",
      hash: "#s2",
      replace: (url: string) => (replaced = url),
    },
    document: { documentElement: { setAttribute: (n: string, v: string) => (attrs[n] = v) } },
  };
  vm.runInNewContext(langInitScript(base), context);
  return { lang: attrs.lang, replaced };
}

test("langInitScript sets <html lang> from the path", () => {
  assert.equal(runInit("/bn/topics/inference/", null).lang, "bn");
  assert.equal(runInit("/topics/inference/", null).lang, "en");
  assert.equal(runInit("/", null, "").lang, "en");
});

test("langInitScript sends a reader to the saved language, keeping query and hash", () => {
  assert.equal(runInit("/topics/inference/", "bn").replaced, "/repo/bn/topics/inference/?q=1#s2");
  assert.equal(runInit("/bn/topics/inference/", "en").replaced, "/repo/topics/inference/?q=1#s2");
  assert.equal(runInit("/", "bn", "").replaced, "/bn/?q=1#s2");
});

test("langInitScript does nothing when the saved language matches or is missing", () => {
  assert.equal(runInit("/bn/", "bn").replaced, null);
  assert.equal(runInit("/topics/x/", "en").replaced, null);
  assert.equal(runInit("/topics/x/", null).replaced, null);
  assert.equal(runInit("/topics/x/", "fr").replaced, null);
});

test("both dictionaries have the same keys", () => {
  assert.deepEqual(Object.keys(UI.bn).sort(), Object.keys(UI.en).sort());
});

test("fmtNum uses Bangla digits in Bangla", () => {
  assert.equal(fmtNum("en", 13), "13");
  assert.equal(fmtNum("bn", 13), "১৩");
});

test("practiceLang: the Bangla site always shows Bangla tasks", () => {
  for (const voice of ["main", "layman", "bangla", "all"] as const) assert.equal(practiceLang(voice, "bn"), "bn");
  assert.equal(practiceLang("main", "en"), "en");
  assert.equal(practiceLang("bangla", "en"), "bn");
});

test("videosForVoice: the Bangla site shows Bangla videos first in every voice", () => {
  const en1: Video = { id: "zjkBMFhNj_g", title: "A", channel: "C", lang: "en" };
  const bn1: Video = { id: "abcdefghijk", title: "B", channel: "C", lang: "bn" };
  for (const voice of ["main", "layman", "bangla", "all"] as const) {
    assert.deepEqual(videosForVoice([en1, bn1], voice, "bn"), [bn1, en1]);
  }
  assert.deepEqual(videosForVoice([en1, bn1], "main"), [en1]);
});

test("a topic and each section need their Bangla title and intro", async () => {
  const { TopicFileSchema } = await import("../src/lib/content-schema.ts");
  const section = { id: "s1", num: "01", title: "T", sub: "S", bn: { title: "টি", sub: "এস" }, body: [], layman: [], bangla: [] };
  const topic = { slug: "x", title: "X", lede: "L", bn: { title: "এক্স", tagline: "ট্যাগ", lede: "এল" }, sources: [], sections: [section] };
  assert.doesNotThrow(() => TopicFileSchema.parse(topic));
  const noTopicBn: Partial<typeof topic> = { ...topic };
  delete noTopicBn.bn;
  assert.throws(() => TopicFileSchema.parse(noTopicBn), "topic without bn");
  const noSectionBn: Partial<typeof section> = { ...section };
  delete noSectionBn.bn;
  assert.throws(() => TopicFileSchema.parse({ ...topic, sections: [noSectionBn] }), "section without bn");
  assert.throws(() => TopicFileSchema.parse({ ...topic, bn: { ...topic.bn, title: "" } }), "empty bn title");
  assert.throws(() => TopicFileSchema.parse({ ...topic, bn: { ...topic.bn, extra: 1 } }), "extra bn key");
  assert.throws(() => TopicFileSchema.parse({ ...topic, sections: [{ ...section, bn: { title: "টি", sub: "<script>x</script>" } }] }), "bad tag in bn sub");
});
