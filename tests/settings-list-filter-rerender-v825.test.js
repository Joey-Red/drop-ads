import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("active list filters reapply after row identity changes without observing filter-owned hidden state", () => {
  assert.match(source, /mutation\.type === "childList" \|\| mutation\.type === "characterData"/);
  assert.match(source, /childList: true,[\s\S]*subtree: true,[\s\S]*characterData: true/);
  assert.match(source, /attributes: true,[\s\S]*attributeFilter: \["disabled"\]/);
  assert.doesNotMatch(source, /attributeFilter: \[[^\]]*"hidden"/);
  assert.match(source, /controller\.observer\?\.disconnect\(\)/);
});
