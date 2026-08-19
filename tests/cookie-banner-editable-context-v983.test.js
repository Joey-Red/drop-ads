import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("cookie-banner action contexts reject inherited editable regions", () => {
  assert.match(source, /MAX_EDITABLE_ANCESTOR_STEPS = 16/);
  assert.match(source, /elementHasAttribute\(element, "contenteditable"\)/);
  assert.match(source, /value === "" \|\| value === "true" \|\| value === "plaintext-only"/);
  assert.match(source, /if \(state === false\) return true/);
  assert.match(source, /if \(state === true\) return false/);
  assert.match(source, /!editableContextSafe\(element\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowHostGetter, root, \[\]\)/);
});
