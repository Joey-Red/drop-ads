import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M829 picker class selectors are bounded and deterministic", () => {
  assert.match(source, /const MAX_CLASS_TOKEN_SCAN = 64;/);
  assert.match(source, /const MAX_SELECTED_CLASS_TOKENS = 3;/);
  assert.match(source, /length > MAX_CLASS_TOKEN_SCAN\) return \[\];/);
  assert.match(source, /if \(!tokens\.includes\(token\)\) tokens\.push\(token\);/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\);/);
  assert.match(source, /return tokens\.slice\(0, MAX_SELECTED_CLASS_TOKENS\);/);
});
