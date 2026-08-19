import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/import-guard.js", import.meta.url), "utf8");

test("M448 import subscription candidates contain array-kind failures before dense work", () => {
  assert.match(source, /function stateSubscriptionCandidates\(state, label\)/);
  assert.match(source, /try \{ isArray = Array\.isArray\(field\.value\); \}\s*catch \{ throw new TypeError\(`\$\{label\}\.subscriptions array kind is invalid`\); \}/s);
  assert.match(source, /if \(!isArray\) return \[\];/);
  assert.match(source, /snapshotDenseDataArray\(field\.value, `\$\{label\}\.subscriptions`, MAX_NORMALIZED_SUBSCRIPTIONS\)/);
});
