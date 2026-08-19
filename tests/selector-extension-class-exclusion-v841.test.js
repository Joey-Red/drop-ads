import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M841 picker class identity excludes Drop Ads-owned helper classes", () => {
  assert.match(source, /function extensionOwnedClassToken\(token\)/);
  assert.match(source, /token\.startsWith\("drop-ads-"\)/);
  assert.match(source, /if \(!token \|\| extensionOwnedClassToken\(token\)\) continue;/);
  assert.match(source, /const MAX_CLASS_TOKEN_SCAN = 64;/);
  assert.match(source, /const MAX_SELECTED_CLASS_TOKENS = 3;/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\)/);
});
