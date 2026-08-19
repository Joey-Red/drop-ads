import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("shortcut disclosure publishes open-state Escape metadata and owns toggle cleanup", () => {
  assert.match(source, /function syncShortcutDisclosureMetadata\(\)/);
  assert.match(source, /shortcutHelpSummary\.setAttribute\("aria-keyshortcuts", shortcutHelp\?\.open \? "\? Escape" : "\?"\)/);
  assert.match(source, /shortcutHelp\?\.addEventListener\("toggle", handleShortcutHelpToggle\)/);
  assert.match(source, /shortcutHelp\?\.removeEventListener\("toggle", handleShortcutHelpToggle\)/);
  assert.match(source, /if \(rawKey === "Escape" && shortcutHelp\?\.open\)/);
  assert.match(source, /shortcutHelpSummary\.focus\(\)/);
});
