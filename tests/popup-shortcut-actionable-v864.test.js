import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("M864 unavailable shortcut targets fail closed without duplicating policy paths", () => {
  assert.match(keyboard, /if \(!actionable\(control\)\) return false;/);
  assert.match(keyboard, /event\.preventDefault\(\);\n  control\.click\(\);/);
  assert.match(availability, /!control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.doesNotMatch(keyboard, /runtime\.sendMessage|storage\.|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/);
});
