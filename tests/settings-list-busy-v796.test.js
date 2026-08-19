import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("dynamic policy lists publish and clear busy state from row transactions", () => {
  assert.match(source, /function syncListBusy\(list\)/);
  assert.match(source, /list\.querySelector\('\[aria-busy="true"\]'\) !== null/);
  assert.match(source, /list\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /list\.removeAttribute\("aria-busy"\)/);
  assert.match(source, /attributeFilter: \["aria-busy"\]/);
});
