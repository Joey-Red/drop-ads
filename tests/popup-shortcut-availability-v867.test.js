import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");
const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M867 popup shortcuts share one fail-closed availability boundary", () => {
  assert.match(availability, /!pageActive \|\| !control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(availability, /control\.closest\?\.\('\[aria-busy="true"\]'\)/);
  assert.match(keyboard, /import \{ popupShortcutControlAvailable \} from "\.\/shortcut-availability\.js";/);
  assert.match(keyboard, /return popupShortcutControlAvailable\(control, \{ pageActive, popupMain \}\);/);
  assert.doesNotMatch(availability, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/);
});
