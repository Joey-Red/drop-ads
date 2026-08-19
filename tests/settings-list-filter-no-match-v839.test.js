import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const landmarks = fs.readFileSync(new URL("../src/options/list-filter-landmarks.js", import.meta.url), "utf8");

test("Settings no-match presentation stays owned by list-filter without a competing observer", () => {
  assert.match(source, /function updateNoMatchRow\(controller, query, hasEntries, hasMatches\)/);
  assert.match(source, /const shouldShow = Boolean\(query && hasEntries && !hasMatches\)/);
  assert.match(source, /row\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(source, /row\.textContent = "No matching entries"/);
  assert.match(source, /controller\.observer = new globalThis\.MutationObserver/);
  assert.doesNotMatch(landmarks, /import "\.\/list-filter-no-match\.js";/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|sendMessage\(/);
});
