import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("aria-labelledby must agree with direct or visible action names", () => {
  assert.match(safety, /function completeLabelledBySource\(element\)/);
  assert.match(safety, /function labelledByAndOtherNamesAgree\(element\)/);
  assert.match(safety, /const labelledNormalized = Reflect\.apply\(normalizedActionText, undefined, \[labelledBy\]\)/);
  assert.match(safety, /const otherNormalized = Reflect\.apply\(normalizedActionText, undefined, \[other\]\)/);
  assert.match(safety, /labelledNormalized === otherNormalized/);
  assert.match(safety, /if \(!other\) return true/);
  assert.match(safety, /!labelledByAndOtherNamesAgree\(element\)/);
});
