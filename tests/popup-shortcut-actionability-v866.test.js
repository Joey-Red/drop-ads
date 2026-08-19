import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("M866 fails closed on stale, busy, hidden, or mismatched shortcut targets", () => {
  assert.match(keyboard, /item\?\.dataset\?\.shortcutControl !== definition\.controlId/);
  assert.match(keyboard, /control\.id !== definition\.controlId/);
  assert.match(keyboard, /popupShortcutControlAvailable\(control, \{ pageActive, popupMain \}\)/);
  assert.match(availability, /!pageActive \|\| !control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(availability, /control\.closest\?\.\('\[aria-busy="true"\]'\)/);
  assert.match(keyboard, /control\.click\(\)/);
  assert.doesNotMatch(keyboard + availability, /localStorage|sessionStorage|indexedDB|sendBeacon|analytics|telemetry/);
});
