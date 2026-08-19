import assert from "node:assert/strict";
import test from "node:test";

import { ACTION_COUNT_PREFERENCE_KEY, loadActionCountEnabled } from "../src/core/action-count.js";

function apiFor(result) {
  return { storage: { local: { async get() { return result; } } } };
}

test("action count storage read treats accessor-backed preference as absent without invoking it", async () => {
  let reads = 0;
  const result = {};
  Object.defineProperty(result, ACTION_COUNT_PREFERENCE_KEY, {
    enumerable: true,
    get() {
      reads += 1;
      return false;
    }
  });
  assert.equal(await loadActionCountEnabled(apiFor(result)), true);
  assert.equal(reads, 0);
});

test("action count storage read ignores unrelated fields and inherited preference data", async () => {
  assert.equal(
    await loadActionCountEnabled(apiFor({ [ACTION_COUNT_PREFERENCE_KEY]: false, extra: true })),
    false
  );
  const inherited = Object.create({ [ACTION_COUNT_PREFERENCE_KEY]: false });
  assert.equal(await loadActionCountEnabled(apiFor(inherited)), true);
});

test("action count storage read keeps reviewed default for missing or non-boolean values", async () => {
  assert.equal(await loadActionCountEnabled(apiFor({})), true);
  assert.equal(await loadActionCountEnabled(apiFor({ [ACTION_COUNT_PREFERENCE_KEY]: "false" })), true);
});

test("action count storage read accepts canonical booleans", async () => {
  assert.equal(await loadActionCountEnabled(apiFor({ [ACTION_COUNT_PREFERENCE_KEY]: false })), false);
  assert.equal(await loadActionCountEnabled(apiFor({ [ACTION_COUNT_PREFERENCE_KEY]: true })), true);
});
