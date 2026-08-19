import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker stable attributes come from a reviewed bounded catalog", () => {
  assert.match(source, /const SAFE_ATTRIBUTE_NAMES = \["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id", "role", "type"\];/);
  assert.match(source, /for \(const name of SAFE_ATTRIBUTE_NAMES\)/);
  assert.match(source, /const value = stableToken\(raw\);/);
  assert.doesNotMatch(source, /for \(const .* of element\.attributes/);
});
