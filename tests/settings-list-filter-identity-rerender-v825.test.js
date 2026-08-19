import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M825 active filters reapply after rendered identity text changes without observing hidden state", () => {
  assert.match(source, /new globalThis\.MutationObserver\(\(mutations\) => handleListMutations\(controller, mutations\)\)/);
  assert.match(source, /mutation\.type === "childList" \|\| mutation\.type === "characterData"/);
  assert.match(source, /childList: true,[\s\S]*subtree: true,[\s\S]*characterData: true/);
  assert.match(source, /attributeFilter: \["disabled"\]/);
  assert.doesNotMatch(source, /attributeFilter:\s*\[[^\]]*hidden/);
  assert.match(source, /row\.hidden = !matches/);
});
