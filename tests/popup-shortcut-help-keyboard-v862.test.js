import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M862 question mark opens shortcut help and Escape returns focus", () => {
  assert.match(source, /if \(rawKey === "\?"\)/);
  assert.match(source, /shortcutHelp\.open = opening;/);
  assert.match(source, /if \(opening\) \{[\s\S]*syncShortcutHelpAvailability\(\);[\s\S]*shortcutHelpSummary\.focus\(\);[\s\S]*\}/);
  assert.match(source, /if \(rawKey === "Escape" && shortcutHelp\?\.open\)/);
  assert.match(source, /shortcutHelp\.open = false;/);
  assert.match(source, /shortcutHelpSummary\.focus\(\);/);
  assert.match(source, /window\.removeEventListener\("keydown", handlePopupShortcut\)/);
});
