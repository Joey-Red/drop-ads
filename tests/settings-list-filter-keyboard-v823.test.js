import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/options/list-filter.css", import.meta.url), "utf8");

test("list filters expose Escape, ArrowDown, and explicit Clear keyboard recovery", () => {
  assert.match(source, /aria-keyshortcuts", "Escape ArrowDown"/);
  assert.match(source, /event\.key === "Escape" && input\.value/);
  assert.match(source, /event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /clear\.textContent = "Clear"/);
  assert.match(css, /\.list-filter \.list-filter-clear \{[^}]*min-height: 44px/s);
});
