import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SESSION_STATE, normalizeSessionState } from "../src/core/session.js";

function revoked(value) {
  const pair = Proxy.revocable(value, {});
  pair.revoke();
  return pair.proxy;
}

function expectedDefault() {
  return { disabledSites: [...DEFAULT_SESSION_STATE.disabledSites] };
}

test("M429 non-strict session normalization contains revoked root array-kind checks", () => {
  assert.deepEqual(normalizeSessionState(revoked({ disabledSites: [] })), expectedDefault());
  assert.deepEqual(normalizeSessionState(revoked([])), expectedDefault());
});

test("M429 strict session normalization rejects revoked root array-kind checks deterministically", () => {
  assert.throws(
    () => normalizeSessionState(revoked({ disabledSites: [] }), { strictShape: true }),
    /Session state array kind must be inspectable/
  );
  assert.throws(
    () => normalizeSessionState(revoked([]), { strictShape: true }),
    /Session state array kind must be inspectable/
  );
});

test("M429 nested revoked disabledSites retains migration fallback but strict writes reject", () => {
  const nonStrict = { disabledSites: revoked([]) };
  assert.deepEqual(normalizeSessionState(nonStrict), expectedDefault());

  const strict = { disabledSites: revoked([]) };
  assert.throws(
    () => normalizeSessionState(strict, { strictShape: true }),
    /Session disabledSites array kind must be inspectable/
  );
});

test("M429 normal dense session state behavior remains unchanged", () => {
  assert.deepEqual(
    normalizeSessionState({ disabledSites: ["Example.COM", "ads.example"] }, { strictShape: true }),
    { disabledSites: ["ads.example", "example.com"] }
  );
});
