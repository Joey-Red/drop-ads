import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M845 picker attribute and class identity snapshots fail closed when torn", () => {
  assert.match(source, /const rawSnapshot = \[\];[\s\S]*Reflect\.apply\(getAttribute, element, \[name\]\)/);
  assert.match(source, /if \(element\.getAttribute !== getAttribute\) return \[\];/);
  assert.match(source, /if \(raw !== rawSnapshot\[index\]\) return \[\];/);
  assert.match(source, /const MAX_CLASS_TOKEN_SCAN = 64;/);
  assert.match(source, /if \(element\.classList !== classList \|\| classList\.length !== length\) return \[\];/);
  assert.match(source, /if \(classList\[index\] !== rawSnapshot\[index\]\) return \[\];/);
  assert.match(source, /token\.startsWith\("drop-ads-"\)/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\)/);
  assert.match(source, /return tokens\.slice\(0, MAX_SELECTED_CLASS_TOKENS\)/);
});
