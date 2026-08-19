import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("M816 popup busy cleanup and async finalizers do not publish after teardown", () => {
  assert.match(source, /function beginPopupBusy\(control = null\) \{\n  if \(!pageActive\) return \(\) => undefined;/);
  assert.match(source, /if \(released\) return;\n    released = true;\n    if \(!pageActive\) return;/);
  assert.match(source, /pendingMutations = 0;/);
  assert.match(source, /if \(pageActive && enabled\.isConnected\) enabled\.disabled = false;/);
  assert.match(source, /if \(pageActive && siteEnabled\.isConnected\) siteEnabled\.disabled = false;/);
  assert.match(source, /if \(pageActive && pauseSite\.isConnected\) pauseSite\.disabled = false;/);
  assert.match(source, /if \(pageActive && cookieSiteEnabled\.isConnected\) cookieSiteEnabled\.disabled = false;/);
  assert.match(source, /if \(pageActive && pickElement\.isConnected\) pickElement\.disabled = false;/);
  assert.match(source, /if \(pageActive && settings\.isConnected\) settings\.disabled = false;/);
});
