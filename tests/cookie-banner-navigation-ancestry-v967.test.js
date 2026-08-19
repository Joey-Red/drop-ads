import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("cookie-banner actions nested in navigation containers fail closed", () => {
  assert.match(safety, /const MAX_NAVIGATION_ANCESTOR_STEPS = 16/);
  assert.match(safety, /function composedParent\(element\)/);
  assert.match(safety, /Reflect\.apply\(nativeGetRootNode, element, \[\]\)/);
  assert.match(safety, /Reflect\.apply\(nativeShadowHostGetter, root, \[\]\)/);
  assert.match(safety, /tag === "a" \|\| tag === "area"/);
  assert.match(safety, /elementHasAttribute\(element, "href"\)/);
  assert.match(safety, /elementHasAttribute\(element, "formaction"\)/);
  assert.match(safety, /role === "link"/);
  assert.match(safety, /!navigationAncestrySafe\(element\)/);
  assert.doesNotMatch(safety, /element\?\.getRootNode|element\?\.hasAttribute|element\?\.getAttribute/);
});
