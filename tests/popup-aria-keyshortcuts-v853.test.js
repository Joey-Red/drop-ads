import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

const shortcuts = new Map([
  ["enabled", "G"],
  ["site-enabled", "S"],
  ["cookie-site-enabled", "C"],
  ["pause-site", "P"],
  ["pick-element", "E"],
  ["settings", "O"]
]);

test("M853 popup controls expose the same keyboard commands as visible shortcut help", () => {
  for (const [id, key] of shortcuts) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-keyshortcuts="${key}"`));
    assert.match(html, new RegExp(`<kbd>${key}<\\/kbd>`));
  }
  assert.match(html, /id="shortcut-help-summary"[^>]*aria-keyshortcuts="\?"/);
});
