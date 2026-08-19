import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("M865 unavailable popup shortcut targets do not consume keys", () => {
  assert.match(keyboard, /import \{ popupShortcutControlAvailable \} from "\.\/shortcut-availability\.js";/);
  assert.match(keyboard, /function actionable\(control\) \{\s*return popupShortcutControlAvailable\(control, \{ pageActive, popupMain \}\);\s*\}/s);
  assert.match(keyboard, /if \(!actionable\(control\)\) return false;\s*event\.preventDefault\(\);\s*control\.click\(\);/s);
  assert.match(availability, /!pageActive \|\| !control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(availability, /control\.closest\?\.\('\[aria-busy="true"\]'\)/);
});
