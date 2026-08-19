import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("Escape closes popup shortcut help and restores summary focus", () => {
  assert.match(source, /function closeShortcutHelp\(event\)/);
  assert.match(source, /shortcutHelp\.open = false/);
  assert.match(source, /shortcutHelpSummary\.focus\(\)/);
  assert.match(source, /if \(rawKey === "Escape" && shortcutHelp\?\.open\)/);
  assert.match(source, /closeShortcutHelp\(event\)/);
  assert.match(source, /window\.removeEventListener\("keydown", handlePopupShortcut\)/);
});
