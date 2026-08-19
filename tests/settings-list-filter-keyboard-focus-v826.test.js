import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M826 keeps keyboard focus within visible filtered results", () => {
  assert.match(source, /input\.setAttribute\("aria-keyshortcuts", "Escape ArrowDown"\)/);
  assert.match(source, /function focusFirstVisibleRowControl\(controller\)/);
  assert.match(source, /if \(event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)\) event\.preventDefault\(\);/);
  assert.match(source, /function rememberFilteredMutationFocus\(controller, event\)/);
  assert.match(source, /if \(!normalizedQuery\(controller\.input\.value\)\) return;/);
  assert.match(source, /function restoreFilteredMutationFocus\(controller\)/);
  assert.match(source, /if \(!rows\.length\) \{\s*controller\.input\.focus\(\);/);
  assert.match(source, /applyFilter\(controller\);\s*restoreFilteredMutationFocus\(controller\);/);
  assert.match(source, /attributeFilter: \["disabled"\]/);
  assert.match(source, /controller\.pendingMutationFocus = null;/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendMessage|saveState|telemetry|analytics/i);
});
