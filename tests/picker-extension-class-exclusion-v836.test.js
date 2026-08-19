import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M836 excludes Drop Ads injected classes from picker identity", () => {
  assert.match(source, /function extensionOwnedClassToken\(token\)/);
  assert.match(source, /token\.startsWith\("drop-ads-"\)/);
  assert.match(source, /if \(!token \|\| extensionOwnedClassToken\(token\)\) continue;/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\)/);
});
