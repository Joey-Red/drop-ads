import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner activation rejects semantically unavailable controls", () => {
  assert.match(source, /MAX_INTERACTION_ANCESTOR_STEPS = 24/);
  assert.match(source, /function semanticActionAvailable\(element\)/);
  assert.match(source, /Reflect\.apply\(nativeHiddenGetter, current, \[\]\) === true/);
  assert.match(source, /elementHasAttribute\(current, "inert"\)/);
  assert.match(source, /elementAttribute\(current, "aria-hidden"\) === "true"/);
  assert.match(source, /elementAttribute\(current, "aria-disabled"\) === "true"/);
  assert.match(source, /elementTagName\(current\) === "fieldset"/);
  assert.match(source, /Reflect\.apply\(nativeFieldSetDisabledGetter, current, \[\]\) === true/);
  assert.match(source, /if \(!nodeConnected\(element\) \|\| !semanticActionAvailable\(element\)\) return false/);
  assert.doesNotMatch(source, /current\.hidden|current\.hasAttribute|current\.getAttribute|instanceof HTMLFieldSetElement|element\?\.isConnected/);
});
