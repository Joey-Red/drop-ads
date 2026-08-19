import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
test("popup controls publish the exact shipped keyboard shortcuts", () => {
  for (const [id, key] of [["enabled","G"],["site-enabled","S"],["cookie-site-enabled","C"],["pause-site","P"],["pick-element","E"],["settings","O"]]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-keyshortcuts="${key}"`));
  }
});
