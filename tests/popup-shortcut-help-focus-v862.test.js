import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M862 shortcut help has keyboard open and Escape focus recovery", () => {
  assert.match(source, /if \(rawKey === "\?"\)/);
  assert.match(source, /function toggleShortcutHelp\(event\)/);
  assert.match(source, /const opening = !shortcutHelp\.open/);
  assert.match(source, /shortcutHelp\.open = opening/);
  assert.match(source, /if \(opening\) \{[\s\S]*syncShortcutHelpAvailability\(\);[\s\S]*shortcutHelpSummary\.focus\(\);[\s\S]*\}/);
  assert.match(source, /if \(rawKey === "Escape" && shortcutHelp\?\.open\)/);
  assert.match(source, /function closeShortcutHelp\(event\)/);
  assert.match(source, /shortcutHelp\.open = false/);
  assert.match(source, /shortcutHelpSummary\.focus\(\)/);
});
