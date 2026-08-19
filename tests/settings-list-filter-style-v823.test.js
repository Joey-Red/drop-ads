import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/options/list-filter.css", import.meta.url), "utf8");

test("Settings list filters retain accessible resilient presentation", () => {
  assert.match(css, /input\[type="search"\][^{]*\{[^}]*min-height: 44px;/s);
  assert.match(css, /\.list-filter-clear[^\{]*\{[^}]*min-height: 44px;/s);
  assert.match(css, /:focus-visible[^\{]*\{ outline: 3px solid currentColor; outline-offset: 3px; \}/);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline-color: Highlight/);
});
