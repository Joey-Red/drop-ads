import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M820 list filtering searches visible row identity rather than action chrome", () => {
  assert.match(source, /function rowIdentityNode\(row\)/);
  assert.match(source, /const ruleCopy = row\.querySelector\?\.\("\.rule-copy"\)/);
  assert.match(source, /if \(ruleCopy\) return ruleCopy;/);
  assert.match(source, /if \(row\.classList\?\.contains\("subscription-item"\)\)/);
  assert.match(source, /if \(!child\.classList\?\.contains\("subscription-controls"\)\) return child;/);
  assert.match(source, /return row\.querySelector\?\.\("code, strong"\) \?\? row;/);
  assert.match(source, /return \(rowIdentityNode\(row\)\?\.textContent \?\? ""\)\.toLowerCase\(\);/);
  assert.doesNotMatch(source, /row\.textContent[^\n]*toLowerCase/);
});
