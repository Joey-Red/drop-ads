import test from "node:test";
import assert from "node:assert/strict";
import { pendingImportRemoteActivations } from "../src/core/import-guard.js";

const emptyCache = {};

function candidateState(subscriptions = []) {
  return { subscriptions };
}

test("import state subscription extraction contains prototype and descriptor traps", () => {
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("prototype trap"); } });
  assert.throws(() => pendingImportRemoteActivations(candidateState(), prototypeTrap, emptyCache), /plain object/i);

  const descriptorTrap = new Proxy({}, {
    getOwnPropertyDescriptor(_target, key) {
      if (key === "subscriptions") throw new Error("descriptor trap");
      return undefined;
    }
  });
  assert.throws(() => pendingImportRemoteActivations(candidateState(), descriptorTrap, emptyCache), /subscriptions|plain object/i);
});

test("import state subscription extraction never uses a Proxy has trap", () => {
  let hasReads = 0;
  const state = new Proxy({}, {
    has() {
      hasReads += 1;
      throw new Error("has trap");
    }
  });
  assert.deepEqual(pendingImportRemoteActivations(candidateState(), state, emptyCache), []);
  assert.equal(hasReads, 0);
});

test("import state subscription extraction accepts null-prototype states", () => {
  const current = Object.create(null);
  current.subscriptions = [];
  assert.deepEqual(pendingImportRemoteActivations(candidateState(), current, emptyCache), []);
});
