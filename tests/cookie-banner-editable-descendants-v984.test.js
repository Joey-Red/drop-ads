import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("cookie-banner actions fail closed on editable descendants within a bounded subtree", () => {
  assert.match(source, /MAX_CONTEXT_DESCENDANT_ELEMENTS = 128/);
  assert.match(source, /function explicitEditableState\(element\)/);
  assert.match(source, /value === "" \|\| value === "true" \|\| value === "plaintext-only"/);
  assert.match(source, /function editableDescendantsSafe\(element, maxElements = MAX_CONTEXT_DESCENDANT_ELEMENTS\)/);
  assert.match(source, /visited > maxElements/);
  assert.match(source, /state === EDITABLE_ERROR \|\| state === true/);
  assert.match(source, /!editableDescendantsSafe\(element\)/);
  assert.match(source, /Reflect\.apply\(nativeTreeWalkerNextNode, walker, \[\]\)/);
});
