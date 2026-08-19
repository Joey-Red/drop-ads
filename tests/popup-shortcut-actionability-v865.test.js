import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");
const keyboard = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M865 popup shortcuts share one fail-closed actionability boundary", () => {
  assert.match(helper, /!pageActive/);
  assert.match(helper, /!control\?\.isConnected/);
  assert.match(helper, /control\.disabled/);
  assert.match(helper, /control\.hidden === true/);
  assert.match(helper, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(helper, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(helper, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(helper, /control\.closest\?\.\('\[aria-busy="true"\]'\)/);
  assert.match(keyboard, /import \{ popupShortcutControlAvailable \} from "\.\/shortcut-availability\.js";/);
  assert.match(keyboard, /return popupShortcutControlAvailable\(control, \{ pageActive, popupMain \}\);/);
  assert.doesNotMatch(helper, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
});
