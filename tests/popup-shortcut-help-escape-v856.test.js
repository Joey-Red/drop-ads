import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M856 Escape closes open shortcut help and restores summary focus", () => {
  assert.match(source, /function closeShortcutHelp\(event\)/);
  assert.match(source, /!shortcutHelp\.open\) return false/);
  assert.match(source, /shortcutHelp\.open = false/);
  assert.match(source, /shortcutHelpSummary\.focus\(\)/);
  assert.match(source, /rawKey === "Escape" && shortcutHelp\?\.open/);
  assert.match(source, /if \(event\.ctrlKey \|\| event\.metaKey \|\| event\.altKey\) return/);
  assert.match(source, /event\.repeat \|\| event\.isComposing/);
  assert.match(source, /textEntryTarget\(event\.target\)/);
  assert.match(source, /window\.removeEventListener\("keydown", handlePopupShortcut\)/);
});
