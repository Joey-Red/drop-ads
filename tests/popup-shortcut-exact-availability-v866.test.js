import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const catalog = fs.readFileSync(new URL("../src/popup/shortcut-catalog.js", import.meta.url), "utf8");
const bindings = fs.readFileSync(new URL("../src/popup/shortcut-bindings.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("popup shortcut help binds every row to the reviewed native command target and exact actionability", () => {
  for (const [key, id] of [["g", "enabled"], ["s", "site-enabled"], ["p", "pause-site"], ["c", "cookie-site-enabled"], ["e", "pick-element"], ["o", "settings"]]) {
    assert.match(html, new RegExp(`data-shortcut="${key}"[^>]*data-shortcut-control="${id}"`));
    assert.match(catalog, new RegExp(`key: "${key}"[^}]*controlId: "${id}"`));
  }
  assert.match(keyboard, /const shortcutDefinitions = POPUP_SHORTCUTS;/);
  assert.match(keyboard, /const shortcutControls = bindPopupShortcutControls\(document, shortcutDefinitions\);/);
  assert.match(keyboard, /function shortcutControlForHelpItem\(item\)/);
  assert.match(keyboard, /item\?\.dataset\?\.shortcutControl !== definition\.controlId/);
  assert.match(keyboard, /const available = actionable\(control\)/);
  assert.match(keyboard, /item\.hidden = false/);
  assert.match(keyboard, /item\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(keyboard, /attributeFilter: \["hidden", "disabled", "aria-busy"\]/);
  assert.match(keyboard, /shortcutAvailabilityObserver\?\.disconnect\(\)/);
  assert.match(bindings, /keys\.has\(key\) \|\| controlIds\.has\(controlId\)/);
  assert.match(bindings, /documentLike\.getElementById\(controlId\)/);
  assert.match(availability, /!pageActive \|\| !control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
});

test("shortcut help remains page-local and non-persistent", () => {
  assert.doesNotMatch(keyboard + catalog + bindings + availability, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|analytics|telemetry/);
});
