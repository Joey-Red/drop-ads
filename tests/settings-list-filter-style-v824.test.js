import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/list-filter.css", import.meta.url), "utf8");

test("Settings list filters retain responsive 44px accessible styling", () => {
  assert.match(css, /\.list-filter \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/s);
  assert.match(css, /input\[type="search"\][^}]*min-height: 44px/s);
  assert.match(css, /\.list-filter-clear[^}]*min-height: 44px/s);
  assert.match(css, /:focus-visible[^}]*outline: 3px solid currentColor/s);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
});
