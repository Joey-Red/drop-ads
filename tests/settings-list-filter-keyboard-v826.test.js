import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M826 list filters expose explicit clear and keyboard navigation", () => {
  assert.match(source, /clear\.textContent = "Clear"/);
  assert.match(source, /clear\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.match(source, /input\.setAttribute\("aria-keyshortcuts", "Escape ArrowDown"\)/);
  assert.match(source, /if \(event\.key === "Escape" && input\.value\)/);
  assert.match(source, /if \(event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)\) event\.preventDefault\(\)/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /controller\.input\.removeEventListener\("keydown", controller\.onKeyDown\)/);
  assert.match(source, /controller\.clear\.removeEventListener\("click", controller\.clearFilter\)/);
});
