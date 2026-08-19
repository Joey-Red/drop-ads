import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(new URL("../.github/workflows/community-promote.yml", import.meta.url), "utf8");

test("M885 approved community promotion is serialized per issue", () => {
  assert.match(workflow, /concurrency:\n  group: community-promotion-\$\{\{ github\.event\.issue\.number \}\}\n  cancel-in-progress: false/);
  assert.match(workflow, /github\.event\.label\.name == 'community-approved'/);
  assert.match(workflow, /Verify approving actor can write repository contents/);
});
