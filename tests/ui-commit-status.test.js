import test from "node:test";
import assert from "node:assert/strict";
import {
  GLOBAL_BLOCKING_OFF_STATUS,
  GLOBAL_BLOCKING_ON_STATUS,
  globalBlockingCommitStatus,
  subscriptionCommitStatus
} from "../src/core/ui-commit-status.js";

test("subscription status distinguishes applying from committed state", () => {
  assert.equal(subscriptionCommitStatus(true, false), "Configured: enabled");
  assert.equal(subscriptionCommitStatus(false, false), "Configured: disabled");
  assert.equal(subscriptionCommitStatus(true, true), "Configured state: applying change…");
  assert.equal(subscriptionCommitStatus(false, true), "Configured state: applying change…");
});

test("global blocking status is explicit in both states", () => {
  assert.equal(globalBlockingCommitStatus(true), GLOBAL_BLOCKING_ON_STATUS);
  assert.equal(globalBlockingCommitStatus(false), GLOBAL_BLOCKING_OFF_STATUS);
  assert.equal(GLOBAL_BLOCKING_ON_STATUS, "Global blocking is on.");
});

test("status helpers reject ambiguous non-boolean state", () => {
  assert.throws(() => subscriptionCommitStatus("true", false), TypeError);
  assert.throws(() => subscriptionCommitStatus(true, 1), TypeError);
  assert.throws(() => globalBlockingCommitStatus(1), TypeError);
});
