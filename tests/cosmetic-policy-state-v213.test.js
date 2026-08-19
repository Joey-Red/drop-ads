import assert from "node:assert/strict";
import test from "node:test";

import { buildCosmeticPolicy } from "../src/core/cosmetic-runtime.js";

function enabledState(overrides = {}) {
  return {
    enabled: true,
    disabledSites: [],
    subscriptions: [],
    personalCosmeticHide: [],
    personalCosmeticAllow: [],
    ...overrides
  };
}

test("cosmetic policy state/session getters are rejected without execution", () => {
  let stateReads = 0;
  const state = enabledState();
  Object.defineProperty(state, "disabledSites", {
    enumerable: true,
    get() {
      stateReads += 1;
      return [];
    }
  });
  assert.throws(() => buildCosmeticPolicy({ hostname: "example.com", state }), /own enumerable data field/);
  assert.equal(stateReads, 0);

  let sessionReads = 0;
  const session = {};
  Object.defineProperty(session, "disabledSites", {
    enumerable: true,
    get() {
      sessionReads += 1;
      return [];
    }
  });
  assert.throws(() => buildCosmeticPolicy({ hostname: "example.com", state: enabledState(), session }), /own enumerable data field/);
  assert.equal(sessionReads, 0);
});

test("cosmetic policy disabled-site arrays must be dense and bounded", () => {
  const sparse = new Array(1);
  assert.throws(() => buildCosmeticPolicy({ hostname: "example.com", state: enabledState({ disabledSites: sparse }) }), /enumerable data entries/);

  const extra = [];
  extra.note = true;
  assert.throws(() => buildCosmeticPolicy({ hostname: "example.com", state: enabledState(), session: { disabledSites: extra } }), /enumerable data entries/);
});

test("cosmetic policy enabled scalar is strictly boolean", () => {
  assert.throws(() => buildCosmeticPolicy({ hostname: "example.com", state: enabledState({ enabled: "true" }) }), /enabled must be boolean/);
});

test("cosmetic policy normal enabled and disabled-site behavior remains deterministic", () => {
  const active = buildCosmeticPolicy({ hostname: "example.com", state: enabledState(), session: { disabledSites: [] }, cache: {} });
  assert.equal(active.enabled, true);
  assert.equal(active.selectorCount, 0);

  const disabled = buildCosmeticPolicy({ hostname: "sub.example.com", state: enabledState({ disabledSites: ["example.com"] }), session: { disabledSites: [] }, cache: {} });
  assert.deepEqual(disabled, { enabled: false, selectorCount: 0, stylesheet: "" });
});
