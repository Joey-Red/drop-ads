import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1163 caps aggregate build-input bytes while descriptors are admitted", () => {
  assert.match(source, /MAX_BUILD_INPUT_AGGREGATE_BYTES = 256 \* 1024 \* 1024/);
  assert.match(source, /let aggregateBytes = 0/);
  assert.match(source, /aggregateBytes \+= descriptor\.bytes/);
  assert.match(source, /aggregateBytes > MAX_BUILD_INPUT_AGGREGATE_BYTES/);
  assert.match(source, /Build input aggregate exceeds the/);
});
