import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/shortcut-bindings.js", import.meta.url), "utf8");
const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("popup shortcut bindings derive exact unique controls from the catalog", () => {
  assert.match(source, /const MAX_POPUP_SHORTCUTS = 16/);
  assert.match(source, /const SAFE_CONTROL_ID = \/\^\[A-Za-z\]/);
  assert.match(source, /keys\.has\(key\) \|\| controlIds\.has\(controlId\)/);
  assert.match(source, /documentLike\.getElementById\(controlId\)/);
  assert.match(source, /return Object\.freeze\(controls\)/);
  assert.match(keyboard, /import \{ bindPopupShortcutControls \} from "\.\/shortcut-bindings\.js"/);
  assert.match(keyboard, /const shortcutControls = bindPopupShortcutControls\(document, shortcutDefinitions\)/);
  assert.doesNotMatch(keyboard, /Object\.fromEntries\(/);
});
