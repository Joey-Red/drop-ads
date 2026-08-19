import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const verify = fs.readFileSync(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1156 generated verification bounds aggregate expected and actual bytes", () => {
  assert.match(verify, /GENERATED_VERIFY_AGGREGATE_MAX_BYTES = 64 \* 1024 \* 1024/);
  assert.match(verify, /expected generated content/);
  assert.match(verify, /actual generated content/);
  assert.match(verify, /aggregate generated verification byte ceiling exceeded/);
  assert.match(verify, /Number\.isSafeInteger\(next\)/);
});
