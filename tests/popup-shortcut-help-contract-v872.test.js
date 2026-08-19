import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = fs.readFileSync(new URL("../src/popup/shortcut-help-contract.js", import.meta.url), "utf8");
const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M872 shortcut help requires exact catalog parity before keyboard routing", () => {
  assert.match(contract, /rows\.length !== POPUP_SHORTCUTS\.length/);
  assert.match(contract, /byKey\.has\(key\)/);
  assert.match(contract, /row\.dataset\?\.shortcutControl !== definition\.controlId/);
  assert.match(contract, /rowText\(row, "kbd"\) !== definition\.shortcut/);
  assert.match(contract, /rowText\(row, "span:not\(\.shortcut-availability\)"\) !== definition\.help/);
  assert.match(contract, /row\.hasAttribute\?\.\("data-site-shortcut"\) !== definition\.siteOnly/);
  assert.match(keyboard, /const shortcutHelpItems = bindPopupShortcutHelp\(shortcutHelp\);/);
  assert.match(keyboard, /const shortcutCatalogReady = Boolean\(shortcutHelpItems\);/);
  assert.match(keyboard, /if \(!shortcutCatalogReady \|\| !pageActive/);
});
