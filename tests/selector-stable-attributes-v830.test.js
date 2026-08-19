import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M830 picker uses a fixed reviewed set of stable attributes before classes", () => {
  assert.match(source, /const SAFE_ATTRIBUTE_NAMES = \["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id", "role", "type"\]/);
  assert.match(source, /function stableAttributeSelectors\(element\)/);
  assert.match(source, /for \(const name of SAFE_ATTRIBUTE_NAMES\)/);
  assert.match(source, /const value = stableToken\(raw\)/);
  assert.match(source, /if \(value\) selectors\.push\(`\[\$\{name\}="\$\{cssEscape\(value\)\}"\]`\)/);
  assert.match(source, /for \(const attribute of stableAttributeSelectors\(element\)\)[\s\S]*stableClassSelectorCandidates\(element, tag\)/);
  assert.doesNotMatch(source, /\.attributes\b|dataset\b/);
});
