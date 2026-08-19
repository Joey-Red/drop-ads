import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const landmarks = fs.readFileSync(new URL("../src/options/list-filter-landmarks.js", import.meta.url), "utf8");

test("active Settings filters expose a visual-only no-match row from the single filter owner", () => {
  assert.match(source, /function updateNoMatchRow\(controller, query, hasEntries, hasMatches\)/);
  assert.match(source, /row\.className = "list-filter-no-match"/);
  assert.match(source, /row\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(source, /row\.textContent = "No matching entries"/);
  assert.match(source, /function isSyntheticPresentationRow\(row\)/);
  assert.doesNotMatch(landmarks, /import "\.\/list-filter-no-match\.js";/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|sendMessage\(/);
});
