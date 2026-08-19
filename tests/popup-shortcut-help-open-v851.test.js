import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("question mark opens native popup shortcut help and focuses its summary", () => {
  assert.match(html, /<details id="shortcut-help"/);
  assert.match(html, /id="shortcut-help-summary" aria-keyshortcuts="\?"/);
  assert.match(source, /function toggleShortcutHelp\(event\)/);
  assert.match(source, /const opening = !shortcutHelp\.open/);
  assert.match(source, /shortcutHelp\.open = opening/);
  assert.match(source, /if \(opening\) \{[\s\S]*syncShortcutHelpAvailability\(\);[\s\S]*shortcutHelpSummary\.focus\(\);/);
  assert.match(source, /if \(rawKey === "\?"\)/);
});
