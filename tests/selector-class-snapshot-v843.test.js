import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M843 picker class candidates fail closed on torn class-list snapshots", () => {
  assert.match(source, /const rawSnapshot = \[\];/);
  assert.match(source, /rawSnapshot\.push\(raw\)/);
  assert.match(source, /if \(element\.classList !== classList \|\| classList\.length !== length\) return \[\];/);
  assert.match(source, /if \(classList\[index\] !== rawSnapshot\[index\]\) return \[\];/);
  assert.match(source, /if \(!Number\.isInteger\(length\) \|\| length < 0 \|\| length > MAX_CLASS_TOKEN_SCAN\) return \[\];/);
});
