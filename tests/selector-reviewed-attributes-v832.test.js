import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M832 picker tries every reviewed stable attribute before class/ancestry fallback", () => {
  assert.match(source, /const SAFE_ATTRIBUTE_NAMES = \["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id", "role", "type"\]/);
  assert.match(source, /function stableAttributeSelectors\(element\)/);
  assert.match(source, /for \(const name of SAFE_ATTRIBUTE_NAMES\)/);
  assert.match(source, /if \(value\) selectors\.push\(`\[\$\{name\}="\$\{cssEscape\(value\)\}"\]`\)/);
  assert.match(source, /for \(const attribute of stableAttributeSelectors\(element\)\) candidates\.push\(`\$\{tag\}\$\{attribute\}`\)/);
  assert.match(source, /candidates\.push\(\.\.\.stableClassSelectorCandidates\(element, tag\)\);/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate;/);
});
