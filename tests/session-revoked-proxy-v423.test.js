import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSessionState, DEFAULT_SESSION_STATE } from "../src/core/session.js";

function revoked(target) {
  const { proxy, revoke } = Proxy.revocable(target, {});
  revoke();
  return proxy;
}

test("M423 non-strict session normalization falls back on revoked root and disabledSites", () => {
  assert.deepEqual(normalizeSessionState(revoked({ disabledSites: [] })), structuredClone(DEFAULT_SESSION_STATE));
  assert.deepEqual(normalizeSessionState(revoked([])), structuredClone(DEFAULT_SESSION_STATE));
  assert.deepEqual(normalizeSessionState({ disabledSites: revoked([]) }), structuredClone(DEFAULT_SESSION_STATE));
});

test("M423 strict session normalization rejects revoked root and disabledSites deterministically", () => {
  assert.throws(() => normalizeSessionState(revoked({ disabledSites: [] }), { strictShape: true }), /array kind must be inspectable/);
  assert.throws(() => normalizeSessionState(revoked([]), { strictShape: true }), /array kind must be inspectable/);
  assert.throws(() => normalizeSessionState({ disabledSites: revoked([]) }, { strictShape: true }), /array kind must be inspectable/);
});
