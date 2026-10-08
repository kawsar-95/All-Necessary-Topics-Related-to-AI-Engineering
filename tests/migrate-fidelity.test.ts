import { test } from "node:test";
import assert from "node:assert/strict";
import { blocksText, compareText, legacyText } from "../scripts/migrate/fidelity.ts";

test("legacyText drops the voice head, svg, and tags, and keeps pseudo-tags", () => {
  const html =
    '<div class="layman-head"><span class="label">Layman</span></div>' +
    '<p>Wrap it in <document> &amp; go</p><div class="diagram"><svg><text>x</text></svg>' +
    '<div class="diagram-caption">Cap</div></div><table><tr><td>a</td><td>b</td></tr></table>';
  assert.equal(legacyText(html), "Wrap it in <document> & go Cap a b");
});

test("blocksText walks nested blocks and uses code, not svg", () => {
  const text = blocksText([
    { type: "paragraph", html: "Wrap it in &lt;document&gt; <strong>&amp;</strong> go" },
    { type: "diagram", svg: "<svg><text>x</text></svg>", caption: "Cap" },
    { type: "callout", variant: "info", blocks: [{ type: "code", lang: "text", code: "a < b", html: "" }] },
    { type: "panels", panels: [{ heading: "H", blocks: [{ type: "list", ordered: false, items: ["i"] }] }] },
  ]);
  assert.equal(text, "Wrap it in <document> & go Cap a < b H i");
});

test("compareText classifies whitespace-only and text differences", () => {
  assert.equal(compareText("a b", "a b"), null);
  assert.equal(compareText("ab c", "a b c")?.kind, "whitespace");
  assert.equal(compareText("a b c", "a c")?.kind, "text");
});
