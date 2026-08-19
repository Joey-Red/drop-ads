import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("popup shortcut activation rejects stale disabled hidden and busy controls", () => {
  assert.match(keyboard, /function actionable\(control\)/);
  assert.match(keyboard, /popupShortcutControlAvailable\(control, \{ pageActive, popupMain \}\)/);
  assert.match(keyboard, /if \(!actionable\(control\)\) return false/);
  assert.match(keyboard, /event\.preventDefault\(\);\s*control\.click\(\)/s);
  assert.match(availability, /!control\?\.isConnected/);
  assert.match(availability, /control\.disabled/);
  assert.match(availability, /control\.hidden === true/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
});
