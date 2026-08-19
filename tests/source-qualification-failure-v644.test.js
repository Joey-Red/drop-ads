import test from "node:test";
import assert from "node:assert/strict";
import { SOURCE_QUALIFICATION_FAILURE_CODE, sourceQualificationFailure } from "../tools/source-qualification-failure.mjs";

test("source qualification failure envelope is fixed and frozen", () => {
  const failure = sourceQualificationFailure("hagezi-pro-mini");
  assert.deepEqual(failure, { id: "hagezi-pro-mini", error: SOURCE_QUALIFICATION_FAILURE_CODE });
  assert.equal(Object.isFrozen(failure), true);
});

test("source qualification failure envelope rejects malformed ids", () => {
  assert.throws(() => sourceQualificationFailure("bad\nid"), /invalid/);
  assert.throws(() => sourceQualificationFailure(""), /invalid/);
});
