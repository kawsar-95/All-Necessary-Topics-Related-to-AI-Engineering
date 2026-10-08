import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import manifest from "../src/app/manifest.ts";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));

test("manifest: URLs are relative, so they work under the GitHub Pages base path", () => {
  const m = manifest();
  assert.equal(m.start_url, "./");
  assert.equal(m.scope, "./");
  for (const icon of m.icons ?? []) assert.doesNotMatch(icon.src, /^\//);
});

test("manifest: has the 192 px and 512 px icons that install needs, and a maskable icon", () => {
  const icons = manifest().icons ?? [];
  assert.ok(icons.some((i) => i.sizes === "192x192"));
  assert.ok(icons.some((i) => i.sizes === "512x512" && i.purpose === "any"));
  assert.ok(icons.some((i) => i.purpose === "maskable"));
  for (const icon of icons) assert.ok(existsSync(publicDir + icon.src), `missing public/${icon.src}`);
});

test("manifest: opens as a standalone app", () => {
  assert.equal(manifest().display, "standalone");
});
