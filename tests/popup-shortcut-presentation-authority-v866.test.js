import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const semantics = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("keyboard owns shortcut availability while popup semantics only presents aria-disabled state", () => {
  assert.match(keyboard, /import \{ popupShortcutControlAvailable \} from "\.\/shortcut-availability\.js"/);
  assert.match(keyboard, /item\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(semantics, /function syncShortcutPresentation\(\)/);
  assert.match(semantics, /row\.getAttribute\("aria-disabled"\) === "true"/);
  assert.match(semantics, /attributeFilter: \["aria-disabled"\]/);
  assert.doesNotMatch(semantics, /popupShortcutControlAvailable/);
  assert.doesNotMatch(semantics, /const popupShortcutControls/);
});
