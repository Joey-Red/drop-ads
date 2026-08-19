import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M821 active Settings filters follow identity changes without observing filter-owned hidden state", () => {
  assert.match(source, /mutation\.type === "childList" \|\| mutation\.type === "characterData"/);
  assert.match(source, /applyFilter\(controller\)/);
  assert.match(source, /childList: true/);
  assert.match(source, /subtree: true/);
  assert.match(source, /characterData: true/);
  assert.doesNotMatch(source, /attributeFilter:\s*\[[^\]]*"hidden"/);
});
