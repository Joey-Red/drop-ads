import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/options/list-filter.css", import.meta.url), "utf8");

test("Settings loads first-class list filter styles", () => {
  assert.match(html, /href="list-filter\.css"/);
  assert.match(css, /\.list-filter input\[type="search"\][\s\S]*min-height: 44px/);
  assert.match(css, /\.list-filter input\[type="search"\]:focus-visible/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
});
