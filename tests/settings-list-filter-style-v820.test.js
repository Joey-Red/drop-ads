import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/options/list-filter.css", import.meta.url), "utf8");

test("Settings local list filters ship responsive accessible first-class styling", () => {
  assert.match(html, /<link rel="stylesheet" href="list-filter\.css">/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) auto/);
  assert.match(css, /\.list-filter \.list-filter-clear \{[^}]*min-height: 44px/s);
  assert.match(css, /input\[type="search"\][^}]*min-height: 44px/s);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline-color: Highlight/);
});
