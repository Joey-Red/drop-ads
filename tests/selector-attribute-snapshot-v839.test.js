import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M839 reviewed picker attributes are captured from one stable snapshot", () => {
  assert.match(source, /function stableAttributeSelectors\(element\)/);
  assert.match(source, /const rawSnapshot = \[\];/);
  assert.match(source, /rawSnapshot\.push\(raw\)/);
  assert.match(source, /if \(element\.getAttribute !== getAttribute\) return \[\];/);
  assert.match(source, /for \(let index = 0; index < SAFE_ATTRIBUTE_NAMES\.length; index \+= 1\)/);
  assert.match(source, /if \(raw !== rawSnapshot\[index\]\) return \[\];/);
});
