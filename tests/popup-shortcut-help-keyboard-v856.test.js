import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("question mark toggles shortcut help and Escape closes it with focus recovery", () => {
  assert.match(source, /if \(rawKey === "\?"\)/);
  assert.match(source, /const opening = !shortcutHelp\.open/);
  assert.match(source, /shortcutHelp\.open = opening/);
  assert.match(source, /if \(rawKey === "Escape" && shortcutHelp\?\.open\)/);
  assert.match(source, /shortcutHelp\.open = false/);
  assert.match(source, /shortcutHelpSummary\.focus\(\)/);
  assert.match(html, /id="shortcut-help-summary" aria-keyshortcuts="\?"/);
});
