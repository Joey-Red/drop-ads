import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M864 keeps shortcut help discoverable and availability truthful per native control", () => {
  assert.match(html, /Unavailable shortcuts are marked below/);
  assert.match(keyboard, /function shortcutControlForHelpItem\(item\)/);
  assert.match(keyboard, /const control = shortcutControlForHelpItem\(item\)/);
  assert.match(keyboard, /const available = actionable\(control\)/);
  assert.match(keyboard, /item\.hidden = false/);
  assert.doesNotMatch(keyboard, /item\.hidden = true/);
  assert.match(keyboard, /item\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(keyboard, /item\.removeAttribute\("aria-disabled"\)/);
  assert.match(availability, /!control\?\.isConnected/);
  assert.match(availability, /control\.disabled/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /busyAncestor/);
  assert.match(css, /\.shortcut-list li\[aria-disabled="true"\]/);
  assert.doesNotMatch(keyboard + availability, /localStorage|sessionStorage|indexedDB|sendBeacon|analytics|telemetry/);
});
