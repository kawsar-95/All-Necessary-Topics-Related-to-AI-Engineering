import { test } from "node:test";
import assert from "node:assert/strict";
import { TopicFileSchema } from "../src/lib/content-schema.ts";
import type { Practice } from "../src/lib/content-schema.ts";

const valid: Practice = {
  title: "See sampling in action",
  goal: "See why the same prompt gives <strong>different</strong> answers.",
  steps: ["Send Prompt A three times in new chats.", "Compare the three answers."],
  prompts: [{ label: "Prompt A", text: "Give me one name for a coffee shop.\nReply with the name only." }],
  lookFor: ["The names differ between runs."],
  check: { question: "Why do the answers differ?", answer: "The model samples each token from a probability distribution." },
  challenge: "Ask for <em>the most common</em> name. What changes?",
};

function fileWith(practice: unknown) {
  return { slug: "x", title: "X", lede: "L", sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", body: [], layman: [], bangla: [], practice }] };
}

test("TopicFileSchema accepts sections with and without practice", () => {
  assert.doesNotThrow(() => TopicFileSchema.parse(fileWith([valid])));
  assert.doesNotThrow(() => TopicFileSchema.parse(fileWith([valid, { ...valid, title: "Second" }])));
  const none = fileWith(undefined);
  delete (none.sections[0] as { practice?: unknown }).practice;
  assert.doesNotThrow(() => TopicFileSchema.parse(none));
});

test("TopicFileSchema rejects a practice with a missing field", () => {
  for (const key of Object.keys(valid) as (keyof Practice)[]) {
    const partial: Partial<Practice> = { ...valid };
    delete partial[key];
    assert.throws(() => TopicFileSchema.parse(fileWith([partial])), key);
  }
});

test("TopicFileSchema rejects extra keys in a practice, a prompt, or a check", () => {
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, url: "https://chatgpt.com" }])));
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, prompts: [{ ...valid.prompts[0], model: "gpt" }] }])));
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, check: { ...valid.check, hint: "h" } }])));
});

test("TopicFileSchema rejects empty lists and empty text", () => {
  assert.throws(() => TopicFileSchema.parse(fileWith([])), "empty practice list");
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, prompts: [] }])), "no prompts");
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, steps: [] }])), "no steps");
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, lookFor: [] }])), "no look-for");
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, prompts: [{ label: "Prompt A", text: "" }] }])), "empty prompt");
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, title: "" }])), "empty title");
});

test("TopicFileSchema rejects disallowed tags in practice text", () => {
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, goal: "<script>x</script>" }])));
  assert.throws(() => TopicFileSchema.parse(fileWith([{ ...valid, steps: ['<a href="javascript:x">x</a>'] }])));
});
