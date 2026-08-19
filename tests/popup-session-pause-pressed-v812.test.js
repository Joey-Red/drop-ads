import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("M812 popup session pause exposes current toggle state", () => {
  assert.match(source, /const paused = pauseText === "Resume this session"/);
  assert.match(source, /pauseSite\.setAttribute\("aria-pressed", paused \? "true" : "false"\)/);
  assert.match(source, /pauseObserver = new globalThis\.MutationObserver\(handlePopupInteraction\)/);
  assert.match(source, /pauseObserver\.observe\(pauseSite, \{ childList: true, characterData: true, subtree: true \}\)/);
  assert.match(source, /pauseObserver\?\.disconnect\(\)/);
});
