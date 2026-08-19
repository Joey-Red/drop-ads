import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner MutationObserver uses captured constructor and prototype methods", () => {
  assert.match(source, /const Observer = captureData\(globalThis, "MutationObserver"\)/);
  assert.match(source, /const ObserverPrototype = captureData\(Observer, "prototype"\)/);
  assert.match(source, /const observerObserve = captureData\(ObserverPrototype, "observe"\)/);
  assert.match(source, /const observerDisconnect = captureData\(ObserverPrototype, "disconnect"\)/);
  assert.match(source, /Reflect\.construct\(Observer, \[\(\) => \{ scheduleMutationScan\(\); \}\]\)/);
  assert.match(source, /Reflect\.apply\(observerObserve, instance, \[target, options\]\)/);
  assert.match(source, /Reflect\.apply\(observerDisconnect, instance, \[\]\)/);
  assert.match(source, /observer = Object\.freeze\(\{ observe, disconnect \}\)/);
  assert.match(source, /if \(!observeTargetOnce\(root\) \|\| !syncOpenShadowObservation\(\)\) return/);
  assert.match(source, /observer\.observe\(target, OBSERVATION_OPTIONS\)/);
  assert.match(source, /observer\?\.disconnect\(\)/);
  assert.doesNotMatch(source, /globalThis\.MutationObserver|captureMethod\(instance, "observe"\)|captureMethod\(instance, "disconnect"\)/);
});

test("observer setup resynchronizes captured open-shadow discovery", () => {
  assert.match(source, /syncOpenShadowObservation\(\)/);
  assert.match(source, /const root = currentDocumentElement\(\)/);
  assert.match(source, /Reflect\.apply\(collectOpenShadowRoots, undefined, \[root\]\)/);
});
