import test from "node:test";
import assert from "node:assert/strict";
import { LIVE_STATE_LIMITS, snapshotPersistedState } from "../src/core/state-limits.js";

function baseState() {
  return {
    enabled: true,
    autoSubmitCommunity: false,
    updateIntervalHours: 12,
    cookieMode: "third-party",
    cookieAllowSites: [],
    personalBlock: [],
    personalAllow: [],
    personalCosmeticHide: [],
    personalCosmeticAllow: [],
    disabledSites: [],
    subscriptions: []
  };
}

test("snapshotPersistedState detaches scalar and collection fields", () => {
  const source = baseState();
  source.disabledSites.push("example.com");
  const snapshot = snapshotPersistedState(source);
  assert.equal(Object.getPrototypeOf(snapshot), null);
  assert.equal(snapshot.enabled, true);
  assert.deepEqual(snapshot.disabledSites, ["example.com"]);
  source.disabledSites[0] = "changed.example";
  assert.deepEqual(snapshot.disabledSites, ["example.com"]);
});

test("snapshotPersistedState accepts null-prototype roots", () => {
  const source = Object.assign(Object.create(null), baseState());
  assert.equal(snapshotPersistedState(source).cookieMode, "third-party");
});

test("snapshotPersistedState never executes root getters", () => {
  const source = baseState();
  let reads = 0;
  Object.defineProperty(source, "enabled", {
    enumerable: true,
    get() { reads += 1; return true; }
  });
  assert.throws(() => snapshotPersistedState(source));
  assert.equal(reads, 0);
});

test("snapshotPersistedState does not use normal property get traps", () => {
  const source = new Proxy(baseState(), {
    get() { throw new Error("normal get trap must not run"); }
  });
  const snapshot = snapshotPersistedState(source);
  assert.equal(snapshot.updateIntervalHours, 12);
});

test("snapshotPersistedState contains descriptor trap failures", () => {
  const source = new Proxy(baseState(), {
    getOwnPropertyDescriptor(target, key) {
      if (key === "cookieMode") throw new Error("descriptor trap");
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => snapshotPersistedState(source), /cookieMode|Persisted state/);
});

test("snapshotPersistedState retains existing dense collection ceilings", () => {
  const source = baseState();
  source.subscriptions = Array.from({ length: LIVE_STATE_LIMITS.subscriptions + 1 }, () => ({}));
  assert.throws(() => snapshotPersistedState(source), /Subscriptions|subscriptions|length/i);
});
