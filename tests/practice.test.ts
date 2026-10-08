import { test } from "node:test";
import assert from "node:assert/strict";
import { TopicFileSchema } from "../src/lib/content-schema.ts";
import type { Practice, PracticeText } from "../src/lib/content-schema.ts";
import { practiceLang } from "../src/lib/practice.ts";

const en: PracticeText = {
  title: "See why AI gives different answers",
  why: "A chatbot can give a <strong>different</strong> answer to the same question.",
  steps: [
    {
      chat: "new",
      do: "Copy this prompt, paste it, and press Enter.",
      prompt: "Complete this sentence with one word only:\nOnce upon a time, there was a little",
      expect: "One word, for example <em>girl</em>.",
      example: "girl",
    },
    { chat: "same", do: "Ask: <em>Why did you pick that word?</em>", expect: "A short reason." },
  ],
  learned: "The AI picks each word by chance from a list of likely words.",
  done: "You have three different story words.",
  check: { question: "Why does the word change?", answer: "The model samples from a distribution." },
  challenge: "Ask for the most common word. What changes?",
};
const bn: PracticeText = { ...en, title: "AI কেন আলাদা উত্তর দেয়", learned: "AI প্রতিটি শব্দ chance দিয়ে বাছে।" };
const valid: Practice = { en, bn };

function fileWith(practice: unknown) {
  return { slug: "x", title: "X", lede: "L", sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", body: [], layman: [], bangla: [], practice }] };
}
const parse = (practice: unknown) => TopicFileSchema.parse(fileWith(practice));
const withEn = (patch: Partial<PracticeText>): Practice => ({ en: { ...en, ...patch }, bn });

test("accepts sections with and without practice", () => {
  assert.doesNotThrow(() => parse([valid]));
  assert.doesNotThrow(() => parse([valid, valid]));
  const none = fileWith(undefined);
  delete (none.sections[0] as { practice?: unknown }).practice;
  assert.doesNotThrow(() => TopicFileSchema.parse(none));
});

test("needs both an English and a Bangla version", () => {
  assert.throws(() => parse([{ en }]), "no bn");
  assert.throws(() => parse([{ bn }]), "no en");
  assert.throws(() => parse([{ ...valid, hi: en }]), "extra language");
});

test("rejects a version with a missing field", () => {
  for (const key of Object.keys(en) as (keyof PracticeText)[]) {
    const partial: Partial<PracticeText> = { ...en };
    delete partial[key];
    assert.throws(() => parse([{ en: partial, bn }]), key);
  }
});

test("a step needs chat, do, and expect; prompt and example are optional", () => {
  const step = en.steps[0];
  for (const key of ["chat", "do", "expect"] as const) {
    const partial: Record<string, unknown> = { ...step };
    delete partial[key];
    assert.throws(() => parse([withEn({ steps: [partial as never] })]), key);
  }
  assert.doesNotThrow(() => parse([withEn({ steps: [{ chat: "new", do: "Read the table.", expect: "Three rows." }] })]));
});

test("the first step opens a new chat", () => {
  assert.throws(() => parse([withEn({ steps: [{ ...en.steps[0], chat: "same" }] })]));
});

test("rejects bad chat values, extra keys, empty lists, and empty text", () => {
  assert.throws(() => parse([withEn({ steps: [{ ...en.steps[0], chat: "old" as never }] })]), "bad chat");
  assert.throws(() => parse([withEn({ steps: [{ ...en.steps[0], url: "x" } as never] })]), "extra step key");
  assert.throws(() => parse([withEn({ steps: [] })]), "no steps");
  assert.throws(() => parse([withEn({ steps: [{ ...en.steps[0], prompt: " " }] })]), "blank prompt");
  assert.throws(() => parse([withEn({ title: "" })]), "empty title");
  assert.throws(() => parse([withEn({ check: { ...en.check, hint: "h" } as never })]), "extra check key");
  assert.throws(() => parse([]), "empty practice list");
});

test("rejects disallowed tags in inline text", () => {
  assert.throws(() => parse([withEn({ why: "<script>x</script>" })]));
  assert.throws(() => parse([withEn({ steps: [{ ...en.steps[0], expect: '<a href="javascript:x">x</a>' }] })]));
});

test("practiceLang: বাংলা voice shows Bangla, every other voice shows English", () => {
  assert.equal(practiceLang("bangla"), "bn");
  assert.equal(practiceLang("main"), "en");
  assert.equal(practiceLang("layman"), "en");
  assert.equal(practiceLang("all"), "en");
});
