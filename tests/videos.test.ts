import { test } from "node:test";
import assert from "node:assert/strict";
import { TopicFileSchema } from "../src/lib/content-schema.ts";
import type { Video } from "../src/lib/content-schema.ts";
import { videosForVoice } from "../src/lib/videos.ts";

const en1: Video = { id: "zjkBMFhNj_g", title: "Intro to LLMs", channel: "Andrej Karpathy", lang: "en" };
const en2: Video = { id: "kCc8FmEb1nY", title: "Let's build GPT", channel: "Andrej Karpathy", lang: "en" };
const bn1: Video = { id: "abcdefghijk", title: "এলএলএম কী", channel: "Example", lang: "bn" };

function fileWith(videos: unknown) {
  return { slug: "x", title: "X", lede: "L", bn: { title: "X", lede: "L" }, sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", bn: { title: "T", sub: "" }, body: [], layman: [], bangla: [], videos }] };
}

test("TopicFileSchema accepts sections with and without videos", () => {
  assert.doesNotThrow(() => TopicFileSchema.parse(fileWith([en1, bn1])));
  const noVideos = fileWith(undefined);
  delete (noVideos.sections[0] as { videos?: unknown }).videos;
  assert.doesNotThrow(() => TopicFileSchema.parse(noVideos));
});

test("TopicFileSchema rejects a malformed video id", () => {
  for (const id of ["short", "zjkBMFhNj_g1", "zjkBMFhNj g", "https://youtu.be/zjkBMFhNj_g"]) {
    assert.throws(() => TopicFileSchema.parse(fileWith([{ ...en1, id }])), id);
  }
});

test("TopicFileSchema rejects an unknown language, an empty title, and extra keys", () => {
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...en1, lang: "hi" }])));
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...en1, title: "" }])));
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...en1, url: "https://youtube.com" }])));
});

test("videosForVoice: Technical and Layman's show English videos", () => {
  assert.deepEqual(videosForVoice([en1, bn1, en2], "main"), [en1, en2]);
  assert.deepEqual(videosForVoice([en1, bn1, en2], "layman"), [en1, en2]);
});

test("videosForVoice: বাংলা shows Bangla videos first, then English", () => {
  assert.deepEqual(videosForVoice([en1, bn1, en2], "bangla"), [bn1, en1, en2]);
  assert.deepEqual(videosForVoice([en1], "bangla"), [en1]);
});

test("videosForVoice: All three shows English, then Bangla", () => {
  assert.deepEqual(videosForVoice([bn1, en1, en2], "all"), [en1, en2, bn1]);
});

test("videosForVoice: no videos gives an empty list", () => {
  assert.deepEqual(videosForVoice(undefined, "main"), []);
  assert.deepEqual(videosForVoice([], "all"), []);
});
