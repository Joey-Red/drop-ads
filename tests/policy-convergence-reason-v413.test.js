import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence, MAX_POLICY_CONVERGENCE_REASON_CHARS } from "../src/core/policy-convergence.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function makeApi() {
  return {
    runtime: { onMessage: eventSource() },
    contextMenus: { onClicked: eventSource() },
    alarms: { onAlarm: eventSource() }
  };
}

test("M413 direct convergence reasons reject non-strings without coercion or sync work", async () => {
  let conversions = 0;
  let syncs = 0;
  const hostile = {
    toString() { conversions += 1; return "hostile"; }
  };
  const registration = installPolicyConvergence({
    api: makeApi(),
    controller: { async syncRules() { syncs += 1; } }
  });

  assert.throws(() => registration.queueConvergence(hostile), /reason must be a string/);
  assert.equal(conversions, 0);
  assert.equal(syncs, 0);
  registration.dispose();
});

test("M413 direct convergence reasons require trimmed printable single-line bounded text", async () => {
  let syncs = 0;
  const registration = installPolicyConvergence({
    api: makeApi(),
    controller: { async syncRules() { syncs += 1; } }
  });

  for (const reason of [
    "",
    " leading",
    "trailing ",
    "line\nbreak",
    "line\u0085break",
    "line\u2028break",
    "line\u2029break",
    "x".repeat(MAX_POLICY_CONVERGENCE_REASON_CHARS + 1)
  ]) {
    assert.throws(() => registration.queueConvergence(reason));
  }
  assert.equal(syncs, 0);

  await registration.queueConvergence("manual policy repair");
  assert.equal(syncs, 1);
  registration.dispose();
});
