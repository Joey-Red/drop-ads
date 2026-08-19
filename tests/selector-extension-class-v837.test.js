import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M837 excludes Drop Ads-owned helper classes from saved picker identity", () => {
  assert.match(source, /function extensionOwnedClassToken\(token\)/);
  assert.match(source, /return typeof token === "string" && token\.startsWith\("drop-ads-"\);/);
  assert.match(source, /if \(!token \|\| extensionOwnedClassToken\(token\)\) continue;/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\);/);
  assert.match(source, /return tokens\.slice\(0, MAX_SELECTED_CLASS_TOKENS\);/);
});
