import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");

test("community promotion snapshots exact own text input before validation", () => {
  assert.match(source, /function snapshotPromotionInput\(input\)/);
  assert.match(source, /Reflect\.ownKeys\(input\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(input, key\)/);
  assert.match(source, /return Object\.freeze\(snapshot\)/);
  assert.match(source, /function promotionResult\(validation, changed, listText\)/);
  assert.match(source, /return Object\.freeze\(\{/);
});
