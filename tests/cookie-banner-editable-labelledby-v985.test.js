import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("aria-labelledby trees reject editable targets and descendants within bounds", () => {
  assert.match(source, /MAX_ARIA_LABELLEDBY_IDS = 4/);
  assert.match(source, /MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256/);
  assert.match(source, /MAX_REFERENCED_LABEL_ELEMENTS = 64/);
  assert.match(source, /function editableLabelledByTreesSafe\(element\)/);
  assert.match(source, /targetRoot !== root/);
  assert.match(source, /const state = explicitEditableState\(target\)/);
  assert.match(source, /state === EDITABLE_ERROR \|\| state === true/);
  assert.match(source, /editableDescendantsSafe\(target, MAX_REFERENCED_LABEL_ELEMENTS\)/);
  assert.match(source, /!editableLabelledByTreesSafe\(element\)/);
});
