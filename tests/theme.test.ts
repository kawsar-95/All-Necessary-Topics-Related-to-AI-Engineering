import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, nextTheme, resolveTheme } from "../src/lib/theme.ts";

test("resolveTheme: a saved choice wins over the device setting", () => {
  assert.equal(resolveTheme("light", false), "light");
  assert.equal(resolveTheme("dark", true), "dark");
});

test("resolveTheme: with no valid saved choice, follow the device", () => {
  assert.equal(resolveTheme(null, true), "light");
  assert.equal(resolveTheme(null, false), "dark");
  assert.equal(resolveTheme("purple", true), "light");
  assert.equal(resolveTheme("", false), "dark");
});

test("nextTheme flips the theme", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
});

/** Runs the inline head script against a fake browser and returns data-theme. */
function runInitScript(stored: string | null, prefersLight: boolean, storageThrows = false) {
  const attrs: Record<string, string> = {};
  const context = {
    localStorage: {
      getItem(key: string) {
        if (storageThrows) throw new Error("blocked");
        return key === THEME_STORAGE_KEY ? stored : null;
      },
    },
    window: {
      matchMedia: (q: string) => ({ matches: q === "(prefers-color-scheme: light)" && prefersLight }),
    },
    document: {
      documentElement: { setAttribute: (name: string, value: string) => (attrs[name] = value) },
    },
  };
  vm.runInNewContext(THEME_INIT_SCRIPT, context);
  return attrs["data-theme"];
}

test("THEME_INIT_SCRIPT agrees with resolveTheme in every case", () => {
  for (const stored of ["light", "dark", null, "purple"]) {
    for (const prefersLight of [true, false]) {
      assert.equal(runInitScript(stored, prefersLight), resolveTheme(stored, prefersLight), `${stored}/${prefersLight}`);
    }
  }
});

test("THEME_INIT_SCRIPT does not throw when storage is blocked", () => {
  assert.doesNotThrow(() => runInitScript(null, true, true));
});
