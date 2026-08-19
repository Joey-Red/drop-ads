import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("active filters expose Alt+ArrowUp row-to-search recovery", () => {
  assert.match(source, /event\.key !== "ArrowUp" \|\| !event\.altKey/);
  assert.match(source, /if \(!input\.value/);
  assert.match(source, /if \(!list\.contains\(event\.target\)\) return/);
  assert.match(source, /event\.preventDefault\(\);\s*input\.focus\(\)/s);
  assert.match(source, /list\.setAttribute\("aria-keyshortcuts", "Alt\+ArrowUp"\)/);
  assert.match(source, /list\.removeEventListener\("keydown", onKeyDown\)/);
});
