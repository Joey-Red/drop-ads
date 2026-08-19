import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner activation follows bounded composed ancestry and open-shadow hits", () => {
  assert.match(source, /MAX_HIT_TEST_SHADOW_DEPTH = 4/);
  assert.match(source, /function composedParent\(element\)/);
  assert.match(source, /Reflect\.apply\(nativeGetRootNode, element, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowHostGetter, root, \[\]\)/);
  assert.match(source, /current = composedParent\(current\)/);
  assert.match(source, /function deepestHitFromPoint\(x, y\)/);
  assert.match(source, /const shadowRoot = openShadowRoot\(hit\)/);
  assert.match(source, /captureData\(shadowRoot, "elementFromPoint"\)/);
  assert.match(source, /Reflect\.apply\(shadowElementFromPoint, shadowRoot, \[x, y\]\)/);
  assert.match(source, /const hit = deepestHitFromPoint/);
  assert.doesNotMatch(source, /element\?\.getRootNode|root\.host/);
});
