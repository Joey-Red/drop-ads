import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const js = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup busy helper exposes and clears control-level aria-busy", () => {
  assert.match(js, /function beginPopupBusy\(control = null\)/);
  assert.match(js, /if \(control\) control\.setAttribute\("aria-busy", "true"\)/);
  assert.match(js, /if \(control\?\.isConnected\) control\.removeAttribute\("aria-busy"\)/);
});

test("popup mutations bind busy state to the active control", () => {
  for (const control of ["enabled", "siteEnabled", "pauseSite", "cookieSiteEnabled", "pickElement"]) {
    assert.match(js, new RegExp(`beginPopupBusy\\(${control}\\)`));
  }
});
