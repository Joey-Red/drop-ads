import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/community-submission-body-io.mjs", import.meta.url), "utf8");

test("community submission body file reads are bounded and stable", () => {
  assert.match(source, /MAX_COMMUNITY_SUBMISSION_BODY_BYTES/);
  assert.match(source, /metadata\.isFile\(\).*metadata\.isSymbolicLink\(\)/s);
  assert.match(source, /const before = await handle\.stat\(\)/);
  assert.match(source, /const after = await handle\.stat\(\)/);
  assert.match(source, /Community submission body changed while it was being read/);
  assert.match(source, /new TextDecoder\("utf-8", \{ fatal: true \}\)/);
});
