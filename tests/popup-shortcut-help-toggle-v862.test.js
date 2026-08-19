import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M862 question mark toggles shortcut help and focuses the visible summary on open", () => {
  assert.match(keyboard, /function toggleShortcutHelp\(event\)/);
  assert.match(keyboard, /const opening = !shortcutHelp\.open;/);
  assert.match(keyboard, /shortcutHelp\.open = opening;/);
  assert.match(keyboard, /if \(opening\) \{[\s\S]*shortcutHelpSummary\.focus\(\);/);
  assert.match(keyboard, /if \(rawKey === "\?"\)/);
  assert.match(keyboard, /event\.repeat \|\| event\.isComposing/);
});
