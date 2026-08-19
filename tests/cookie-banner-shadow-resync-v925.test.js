import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner late observation resynchronizes newly reachable open shadow roots", () => {
  assert.match(source, /const observedTargets = new Set\(\)/);
  assert.match(source, /function observeTargetOnce\(target\)/);
  assert.match(source, /observedTargets\.has\(target\)/);
  assert.match(source, /observedTargets\.add\(target\)/);
  assert.match(source, /function syncOpenShadowObservation\(\)/);
  assert.match(source, /ownDataValue\(shadowRoots, "collectOpenShadowRoots"\)/);
  assert.match(source, /const root = currentDocumentElement\(\)/);
  assert.match(source, /Reflect\.apply\(collectOpenShadowRoots, undefined, \[root\]\)/);
  assert.match(source, /for \(const shadowRoot of roots\)/);
  assert.match(source, /if \(!observeTargetOnce\(shadowRoot\)\) return false/);
  assert.match(source, /if \(!syncOpenShadowObservation\(\)\) return;/);
  assert.match(source, /observedTargets\.clear\(\)/);
  assert.doesNotMatch(source, /document\.documentElement|setInterval/);
});
