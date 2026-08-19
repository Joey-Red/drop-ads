import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/content/picker-save-guard.js", import.meta.url), "utf8");

test("picker save guard captures selector verification collaborators once", () => {
  assert.match(source, /const selectorUniquelyIdentifies = helpers\.selectorUniquelyIdentifies;/);
  assert.match(source, /const maxSelectorLength = helpers\.MAX_SELECTOR_LENGTH;/);
  assert.match(source, /typeof selectorUniquelyIdentifies !== "function"/);
  assert.doesNotMatch(source, /helpers\.selectorUniquelyIdentifies\(selector, target, documentRef\)/);
});
