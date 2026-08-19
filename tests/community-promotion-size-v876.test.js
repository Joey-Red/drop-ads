import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");

test("community promotion refuses output beyond the canonical list ceiling", () => {
  assert.match(source, /MAX_COMMUNITY_LIST_BYTES/);
  assert.match(source, /Buffer\.byteLength\(nextListText, "utf8"\) > MAX_COMMUNITY_LIST_BYTES/);
  assert.match(source, /Promoted community list would exceed the supported size limit/);
  assert.match(source, /changed: false/);
});
