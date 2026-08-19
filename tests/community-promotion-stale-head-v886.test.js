import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(new URL("../.github/workflows/community-promote.yml", import.meta.url), "utf8");

test("M886 promotion is time bounded and refuses a default-branch change after validation", () => {
  assert.match(workflow, /timeout-minutes: 10/);
  assert.match(workflow, /git fetch origin "\$DEFAULT_BRANCH"/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /default branch changed after candidate validation/);
  assert.match(workflow, /exit 1/);
});
