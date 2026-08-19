import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSessionState } from "../src/core/session.js";

function revoked(value) {
  const pair = Proxy.revocable(value, {});
  pair.revoke();
  return pair.proxy;
}

test("loose session normalization falls back for revoked root objects and arrays", () => {
  assert.deepEqual(normalizeSessionState(revoked({ disabledSites: [] })), { disabledSites: [] });
  assert.deepEqual(normalizeSessionState(revoked([])), { disabledSites: [] });
});

test("strict session normalization rejects revoked root array-kind inspection deterministically", () => {
  assert.throws(
    () => normalizeSessionState(revoked({ disabledSites: [] }), { strictShape: true }),
    /Session state array kind must be inspectable/
  );
  assert.throws(
    () => normalizeSessionState(revoked([]), { strictShape: true }),
    /Session state array kind must be inspectable/
  );
});

test("loose session normalization falls back for revoked disabledSites", () => {
  assert.deepEqual(normalizeSessionState({ disabledSites: revoked([]) }), { disabledSites: [] });
  assert.deepEqual(normalizeSessionState({ disabledSites: revoked({}) }), { disabledSites: [] });
});

test("strict session normalization rejects revoked disabledSites deterministically", () => {
  assert.throws(
    () => normalizeSessionState({ disabledSites: revoked([]) }, { strictShape: true }),
    /Session disabledSites array kind must be inspectable/
  );
  assert.throws(
    () => normalizeSessionState({ disabledSites: revoked({}) }, { strictShape: true }),
    /Session disabledSites array kind must be inspectable/
  );
});

test("existing session semantics and dense domain bound remain intact", () => {
  assert.deepEqual(normalizeSessionState({ disabledSites: ["EXAMPLE.COM", "example.com"] }), { disabledSites: ["example.com"] });
  assert.deepEqual(normalizeSessionState({ disabledSites: "example.com" }), { disabledSites: [] });
  assert.throws(
    () => normalizeSessionState({ disabledSites: "example.com" }, { strictShape: true }),
    /Session disabledSites must be an array/
  );
});
