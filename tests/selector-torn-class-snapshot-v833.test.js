import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker class capture validates one stable bounded snapshot", () => {
  assert.match(source, /const MAX_CLASS_TOKEN_SCAN = 64;/);
  assert.match(source, /const rawSnapshot = \[\];/);
  assert.match(source, /rawSnapshot\.push\(raw\);/);
  assert.match(source, /if \(element\.classList !== classList \|\| classList\.length !== length\) return \[\];/);
  assert.match(source, /if \(classList\[index\] !== rawSnapshot\[index\]\) return \[\];/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\);/);
});
