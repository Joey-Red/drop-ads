import assert from "node:assert/strict";
import test from "node:test";

import { MAX_IMPORT_REMOTE_ACTIVATIONS, assertImportRemoteActivationBudget } from "../src/core/import-guard.js";

function stateWith(count) {
  return {
    subscriptions: Array.from({ length: count }, (_, index) => ({
      id: `external-${index}`,
      title: `External ${index}`,
      format: "hosts",
      sourceUrl: `https://example.com/${index}`,
      enabled: true,
      builtIn: false
    }))
  };
}

test("import activation override supports zero and the exact reviewed maximum", () => {
  assert.deepEqual(assertImportRemoteActivationBudget(stateWith(0), { subscriptions: [] }, {}, 0), []);
  assert.equal(assertImportRemoteActivationBudget(stateWith(MAX_IMPORT_REMOTE_ACTIVATIONS), { subscriptions: [] }, {}, MAX_IMPORT_REMOTE_ACTIVATIONS).length, MAX_IMPORT_REMOTE_ACTIVATIONS);
});

test("import activation override cannot exceed the reviewed maximum", () => {
  assert.throws(
    () => assertImportRemoteActivationBudget(stateWith(0), { subscriptions: [] }, {}, MAX_IMPORT_REMOTE_ACTIVATIONS + 1),
    /0 through 16/
  );
});

test("import activation override rejects coercive or unsafe values", () => {
  for (const value of ["16", 1.5, Number.NaN, Number.POSITIVE_INFINITY, -1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => assertImportRemoteActivationBudget(stateWith(0), { subscriptions: [] }, {}, value), /0 through 16/);
  }
});

test("invalid activation limits fail before state inspection", () => {
  let reads = 0;
  const state = {};
  Object.defineProperty(state, "subscriptions", { enumerable: true, get() { reads += 1; return []; } });
  assert.throws(() => assertImportRemoteActivationBudget(state, { subscriptions: [] }, {}, 17), /0 through 16/);
  assert.equal(reads, 0);
});

test("lower activation override still rejects pending sources above that lower bound", () => {
  assert.throws(
    () => assertImportRemoteActivationBudget(stateWith(2), { subscriptions: [] }, {}, 1),
    /requires 2 uncached enabled filter sources/
  );
});
