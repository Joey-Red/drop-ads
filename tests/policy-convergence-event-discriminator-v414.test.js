import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence, MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS } from "../src/core/policy-convergence.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(...args) { for (const listener of [...listeners]) listener(...args); }
  };
}

test("M414 event discriminator strings are bounded, printable, and non-coercive", async () => {
  const runtime = eventSource();
  const context = eventSource();
  const alarm = eventSource();
  let syncs = 0;
  let conversions = 0;
  const registration = installPolicyConvergence({
    api: { runtime: { onMessage: runtime }, contextMenus: { onClicked: context }, alarms: { onAlarm: alarm } },
    controller: { async syncRules() { syncs += 1; } }
  });

  runtime.emit({ type: { toString() { conversions += 1; return "drop-ads:set-enabled"; } } });
  runtime.emit({ type: "x".repeat(MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS + 1) });
  runtime.emit({ type: "drop-ads:set-enabled\n" });
  context.emit({ menuItemId: "x".repeat(MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS + 1) });
  alarm.emit({ name: "x".repeat(MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS + 1) });
  await registration.whenIdle();
  assert.equal(conversions, 0);
  assert.equal(syncs, 0);

  runtime.emit({ type: "drop-ads:set-enabled" });
  await registration.whenIdle();
  assert.equal(syncs, 1);
  registration.dispose();
});
