import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M835 rejects torn class-list snapshots before selector construction", () => {
  assert.match(source, /const rawSnapshot = \[\]/);
  assert.match(source, /rawSnapshot\.push\(raw\)/);
  assert.match(source, /element\.classList !== classList \|\| classList\.length !== length/);
  assert.match(source, /classList\[index\] !== rawSnapshot\[index\]/);
});
