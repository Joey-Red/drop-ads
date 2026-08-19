import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const helpContract = fs.readFileSync(new URL("../src/popup/shortcut-help-contract.js", import.meta.url), "utf8");

test("shortcut help stays discoverable while unavailable actions remain gated", () => {
  assert.match(keyboard, /import \{ bindPopupShortcutHelp \} from "\.\/shortcut-help-contract\.js"/);
  assert.match(keyboard, /const shortcutHelpItems = bindPopupShortcutHelp\(shortcutHelp\)/);
  assert.match(keyboard, /item\.hidden = false;/);
  assert.match(keyboard, /item\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(keyboard, /if \(!actionable\(control\)\) return false;/);
  assert.doesNotMatch(keyboard, /item\.hidden = true/);
  assert.match(helpContract, /return Object\.freeze\(ordered\)/);
});
