import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M825 Escape and Clear share focus-preserving filter recovery", () => {
  assert.match(source, /const clearFilter = \(\) => \{/);
  assert.match(source, /if \(!input\.value\) return;[\s\S]*input\.value = "";[\s\S]*controller\.pendingMutationFocus = null;[\s\S]*applyFilter\(controller\);[\s\S]*input\.focus\(\);/);
  assert.match(source, /if \(event\.key === "Escape" && input\.value\) \{[\s\S]*event\.preventDefault\(\);[\s\S]*clearFilter\(\);[\s\S]*return;/);
  assert.match(source, /event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)/);
  assert.match(source, /clear\.addEventListener\("click", clearFilter\);/);
  assert.match(source, /controller\.clear\.disabled = !controller\.input\.value;/);
  assert.match(source, /input\.setAttribute\("aria-keyshortcuts", "Escape ArrowDown"\)/);
});
