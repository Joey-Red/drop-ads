import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("Alt+ArrowUp returns from a filtered row without stealing native ArrowUp", () => {
  assert.match(source, /event\.key !== "ArrowUp" \|\| !event\.altKey/);
  assert.match(source, /event\.ctrlKey \|\| event\.metaKey \|\| event\.shiftKey/);
  assert.match(source, /list\.setAttribute\("aria-keyshortcuts", "Alt\+ArrowUp"\)/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /list\.removeEventListener\("keydown", onKeyDown\)/);
});
