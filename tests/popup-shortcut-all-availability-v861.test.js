import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const catalog = fs.readFileSync(new URL("../src/popup/shortcut-catalog.js", import.meta.url), "utf8");
const helpContract = fs.readFileSync(new URL("../src/popup/shortcut-help-contract.js", import.meta.url), "utf8");

test("every shortcut help row derives availability from the reviewed catalog and native control", () => {
  assert.match(catalog, /export const POPUP_SHORTCUTS = Object\.freeze/);
  assert.match(keyboard, /const shortcutDefinitions = POPUP_SHORTCUTS;/);
  assert.match(keyboard, /const shortcutHelpItems = bindPopupShortcutHelp\(shortcutHelp\);/);
  assert.match(keyboard, /function shortcutControlForHelpItem\(item\)/);
  assert.match(keyboard, /item\?\.dataset\?\.shortcutControl !== definition\.controlId/);
  assert.match(keyboard, /const available = actionable\(control\)/);
  assert.match(keyboard, /item\.hidden = false;/);
  assert.match(keyboard, /item\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(helpContract, /row\.dataset\?\.shortcutControl !== definition\.controlId/);
});
