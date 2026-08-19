import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");
const availability = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("M866 shortcut help reflects exact native-control actionability", () => {
  assert.match(keyboard, /import \{ popupShortcutControlAvailable \} from "\.\/shortcut-availability\.js";/);
  assert.match(keyboard, /const definition = shortcutDefinition\(item\?\.dataset\?\.shortcut \?\? ""\)/);
  assert.match(keyboard, /const available = actionable\(control\)/);
  assert.match(keyboard, /item\.setAttribute\("aria-disabled", "true"\)/);
  assert.match(keyboard, /item\.removeAttribute\("aria-disabled"\)/);
  assert.match(keyboard, /attributeFilter: \["hidden", "disabled", "aria-busy"\]/);
  assert.match(keyboard, /shortcutAvailabilityObserver\?\.disconnect\(\)/);
  assert.match(availability, /!pageActive \|\| !control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(availability, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(availability, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(availability, /control\.closest\?\.\('\[aria-busy="true"\]'\)/);
  assert.doesNotMatch(keyboard + availability, /localStorage|sessionStorage|indexedDB|history\.|analytics|telemetry/i);
});
