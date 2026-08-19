import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Settings filters match policy identity instead of control text", () => {
  assert.match(source, /function rowIdentityNode\(row\)/);
  assert.match(source, /row\.querySelector\?\.\("\.rule-copy"\)/);
  assert.match(source, /row\.classList\?\.contains\("subscription-item"\)/);
  assert.match(source, /!child\.classList\?\.contains\("subscription-controls"\)/);
  assert.match(source, /row\.querySelector\?\.\("code, strong"\) \?\? row/);
  assert.match(source, /rowIdentityNode\(row\)\?\.textContent/);
  assert.match(source, /\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /row\?\.textContent \?\? ""/);
});
