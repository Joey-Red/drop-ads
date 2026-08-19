import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

const expected = [
  ["enabled", "G"],
  ["site-enabled", "S"],
  ["cookie-site-enabled", "C"],
  ["pause-site", "P"],
  ["pick-element", "E"],
  ["settings", "O"]
];

test("M860 popup native controls publish their keyboard shortcuts", () => {
  for (const [id, key] of expected) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-keyshortcuts="${key}"`));
  }
  assert.match(html, /id="shortcut-help-summary" aria-keyshortcuts="\?"/);
});
