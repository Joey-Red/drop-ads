import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/options/list-filter.css", import.meta.url), "utf8");

test("active transient filters mark their Settings navigation section", () => {
  assert.match(source, /badge\.textContent = "Filtered"/);
  assert.match(source, /badge\.hidden = !\(typeof input\.value === "string" && input\.value\.length > 0\)/);
  assert.match(source, /settingsNav\?\.querySelector\(`a\[href="#\$\{sectionId\}"\]`\)/);
  assert.match(css, /\.list-filter-nav-badge/);
  assert.match(css, /@media \(forced-colors: active\)/);
});
