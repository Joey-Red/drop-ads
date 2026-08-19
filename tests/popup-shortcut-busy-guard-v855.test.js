import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("popup action shortcuts do not collide with an active or unavailable mutation target", () => {
  assert.match(keyboard, /function actionable\(control\)/);
  assert.match(keyboard, /popupShortcutControlAvailable\(control, \{ pageActive, popupMain \}\)/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.disabled/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(keyboard, /if \(control\) activate\(control, event\)/);
});
