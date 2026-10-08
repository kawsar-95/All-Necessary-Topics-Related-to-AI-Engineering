import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "node-html-parser";
import { extractSection } from "../scripts/migrate/source.ts";

const PAGE =
  '<section id="s1"><div class="section-head"><h2>T</h2></div><p class="sub">Sub <em>x</em></p>' +
  '<h3>H</h3><p>Body</p><aside class="layman"><div class="layman-head">L</div><p>Lay</p></aside>' +
  '<aside class="bangla"><p>Bn</p></aside></section><section class="sources" id="sources"></section>';

test("extractSection splits a section into sub, body, layman, bangla", () => {
  assert.deepEqual(extractSection(parse(PAGE), "s1", "test"), {
    sub: "Sub <em>x</em>",
    body: "<h3>H</h3><p>Body</p>",
    layman: '<div class="layman-head">L</div><p>Lay</p>',
    bangla: "<p>Bn</p>",
  });
});

test("extractSection fails loudly for a missing section or part", () => {
  assert.throws(() => extractSection(parse(PAGE), "s2", "test"), /s2.*not found/);
  assert.throws(
    () => extractSection(parse('<section id="s1"><p class="sub">x</p></section>'), "s1", "test"),
    /lacks/,
  );
});
