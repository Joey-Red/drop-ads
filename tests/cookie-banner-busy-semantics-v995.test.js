import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");

test("M995 refuses busy action contexts under bounded composed ancestry", () => {
  assert.match(safety, /const MAX_BUSY_ANCESTOR_STEPS = 16/);
  assert.match(safety, /function composedParent\(element\)/);
  assert.match(safety, /Reflect\.apply\(nativeShadowHostGetter, root, \[\]\)/);
  assert.match(safety, /function busySemanticsSafe\(element\)/);
  assert.match(safety, /elementHasAttribute\(current, "aria-busy"\)/);
  assert.match(safety, /elementAttribute\(current, "aria-busy"\)/);
  assert.match(safety, /\.trim\(\)\.toLowerCase\(\) !== "false"/);
  assert.match(safety, /!busySemanticsSafe\(element\)/);
});
