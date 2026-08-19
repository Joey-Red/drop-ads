import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("M822 transient list filters use Settings control sizing and responsive layout", () => {
  assert.match(css, /input\[type="search"\][^\n]*min-height: 44px/);
  assert.match(css, /\.list-filter \{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/s);
  assert.match(css, /\.list-filter-status \{[^}]*min-height: 1\.55em;/s);
  assert.match(css, /\.list-filter-privacy \{[^}]*font-size: 14px;/s);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*\.list-filter \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.list-filter-clear \{ width: 100%; \}/);
  assert.match(css, /button:focus-visible, input:focus-visible, select:focus-visible/);
  assert.match(css, /@media \(forced-colors: active\)/);
});
