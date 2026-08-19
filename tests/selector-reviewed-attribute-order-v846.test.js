import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M846 tries every reviewed stable attribute before class and structural fallback", () => {
  assert.match(source, /const SAFE_ATTRIBUTE_NAMES = \["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id", "role", "type"\]/);
  assert.match(source, /for \(const name of SAFE_ATTRIBUTE_NAMES\)/);
  assert.match(source, /for \(const attribute of stableAttributeSelectors\(element\)\) candidates\.push\(`\$\{tag\}\$\{attribute\}`\)/);
  assert.match(source, /for \(const attribute of stableAttributeSelectors\(element\)\)[\s\S]*stableClassSelectorCandidates\(element, tag\)/);
  assert.doesNotMatch(source, /candidates\.push\(tag\)/);
});
