import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("active list filters mark only their Settings section link", () => {
  assert.match(source, /badge\.className = "list-filter-nav-badge"/);
  assert.match(source, /badge\.textContent = "Filtered"/);
  assert.match(source, /filterBadges\.set\(input, badge\)/);
  assert.match(source, /badge\.hidden = !\(typeof input\.value === "string" && input\.value\.length > 0\)/);
  assert.match(source, /for \(const badge of filterBadges\.values\(\)\) badge\.remove\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|sendMessage\(/);
});
