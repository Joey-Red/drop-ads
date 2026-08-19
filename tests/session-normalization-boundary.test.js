import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSessionState } from "../src/core/session.js";

test("normalizeSessionState accepts null-prototype state", () => {
  const state = Object.create(null);
  state.disabledSites = ["example.com"];
  assert.deepEqual(normalizeSessionState(state), { disabledSites: ["example.com"] });
});

test("normalizeSessionState does not execute strictShape getters", () => {
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "strictShape", {
    enumerable: true,
    get() { reads += 1; return true; }
  });
  assert.throws(() => normalizeSessionState({ disabledSites: [] }, options));
  assert.equal(reads, 0);
});

test("normalizeSessionState rejects non-boolean strictShape", () => {
  assert.throws(() => normalizeSessionState({ disabledSites: [] }, { strictShape: 1 }), /strictShape must be boolean/);
});

test("normalizeSessionState never executes disabledSites getters", () => {
  let reads = 0;
  const state = {};
  Object.defineProperty(state, "disabledSites", {
    enumerable: true,
    get() { reads += 1; return []; }
  });
  assert.throws(() => normalizeSessionState(state));
  assert.equal(reads, 0);
});

test("normalizeSessionState avoids normal Proxy get traps", () => {
  const state = new Proxy({ disabledSites: ["example.com"] }, {
    get() { throw new Error("normal get trap must not run"); }
  });
  assert.deepEqual(normalizeSessionState(state), { disabledSites: ["example.com"] });
});

test("non-strict malformed values retain migration fallback", () => {
  assert.deepEqual(normalizeSessionState(null), { disabledSites: [] });
  assert.deepEqual(normalizeSessionState({ disabledSites: "bad" }), { disabledSites: [] });
  assert.throws(() => normalizeSessionState({ disabledSites: "bad" }, { strictShape: true }));
});
