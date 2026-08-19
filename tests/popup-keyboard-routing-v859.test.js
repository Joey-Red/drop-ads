import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const catalog = fs.readFileSync(new URL("../src/popup/shortcut-catalog.js", import.meta.url), "utf8");
const bindings = fs.readFileSync(new URL("../src/popup/shortcut-bindings.js", import.meta.url), "utf8");

test("M859 routes page-local popup shortcuts through reviewed native controls", () => {
  assert.match(keyboard, /import \{ POPUP_SHORTCUTS \} from "\.\/shortcut-catalog\.js"/);
  assert.match(keyboard, /const shortcutControls = bindPopupShortcutControls\(document, shortcutDefinitions\)/);
  for (const route of [["g", "enabled"], ["s", "site-enabled"], ["c", "cookie-site-enabled"], ["p", "pause-site"], ["e", "pick-element"], ["o", "settings"]]) {
    assert.match(catalog, new RegExp(`key: "${route[0]}"[^}]*controlId: "${route[1]}"`));
  }
  assert.match(bindings, /documentLike\.getElementById\(controlId\)/);
  assert.match(bindings, /return Object\.freeze\(controls\)/);
  assert.match(keyboard, /control\.click\(\);/);
  assert.doesNotMatch(keyboard, /runtime\.sendMessage|storage\.|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/);
});
