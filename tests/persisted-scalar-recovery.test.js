import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE, normalizePersistedState } from "../src/core/storage.js";

test("omitted persisted scalars retain reviewed defaults", () => {
  const state = normalizePersistedState({});
  assert.equal(state.enabled, DEFAULT_STATE.enabled);
  assert.equal(state.autoSubmitCommunity, DEFAULT_STATE.autoSubmitCommunity);
  assert.equal(state.updateIntervalHours, DEFAULT_STATE.updateIntervalHours);
  assert.equal(state.cookieMode, DEFAULT_STATE.cookieMode);
});

test("type-confused persisted scalars fall back instead of changing semantics", () => {
  const state = normalizePersistedState({
    enabled: "false",
    autoSubmitCommunity: 1,
    updateIntervalHours: "24",
    cookieMode: { mode: "all" }
  });
  assert.equal(state.enabled, true);
  assert.equal(state.autoSubmitCommunity, false);
  assert.equal(state.updateIntervalHours, 12);
  assert.equal(state.cookieMode, "third-party");
});

test("persisted update interval does not execute coercion hooks", () => {
  let coercions = 0;
  const value = {
    valueOf() { coercions += 1; return 24; },
    toString() { coercions += 1; return "24"; }
  };
  const state = normalizePersistedState({ updateIntervalHours: value });
  assert.equal(state.updateIntervalHours, DEFAULT_STATE.updateIntervalHours);
  assert.equal(coercions, 0);
});

test("valid persisted scalar boundaries remain accepted", () => {
  const low = normalizePersistedState({
    enabled: false,
    autoSubmitCommunity: true,
    updateIntervalHours: 1,
    cookieMode: "off"
  });
  assert.equal(low.enabled, false);
  assert.equal(low.autoSubmitCommunity, true);
  assert.equal(low.updateIntervalHours, 1);
  assert.equal(low.cookieMode, "off");

  const high = normalizePersistedState({ updateIntervalHours: 168, cookieMode: "all" });
  assert.equal(high.updateIntervalHours, 168);
  assert.equal(high.cookieMode, "all");
});
