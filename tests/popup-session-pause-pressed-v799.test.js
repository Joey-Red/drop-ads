import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup session pause exposes toggle state through aria-pressed", () => {
  assert.match(source, /function syncPausePressedState\(\)/);
  assert.match(source, /pauseSite\.setAttribute\("aria-pressed", paused \? "true" : "false"\)/);
  assert.match(source, /pauseText === "Resume this session"/);
  assert.match(source, /pauseObserver\.observe\(pauseSite, \{ childList: true, characterData: true, subtree: true \}\)/);
  assert.match(source, /pauseObserver\?\.disconnect\(\)/);
});
