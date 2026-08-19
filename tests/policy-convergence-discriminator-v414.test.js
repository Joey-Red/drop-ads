import test from "node:test";
import assert from "node:assert/strict";
import {
  installPolicyConvergence,
  MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS
} from "../src/core/policy-convergence.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    fire(value) { for (const listener of [...listeners]) listener(value); }
  };
}

function makeApi() {
  const runtimeMessage = eventSource();
  const contextClicked = eventSource();
  const alarm = eventSource();
  return {
    api: {
      runtime: { onMessage: runtimeMessage },
      contextMenus: { onClicked: contextClicked },
      alarms: { onAlarm: alarm }
    },
    runtimeMessage,
    contextClicked,
    alarm
  };
}

test("M414 policy-convergence event discriminators are bounded before routing", async () => {
  const events = makeApi();
  let syncs = 0;
  const registration = installPolicyConvergence({
    api: events.api,
    controller: { async syncRules() { syncs += 1; } }
  });

  assert.equal(MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS, 64);
  events.runtimeMessage.fire({ type: "x".repeat(65) });
  events.runtimeMessage.fire({ type: "drop-ads:set-enabled\n" });
  events.contextClicked.fire({ menuItemId: "x".repeat(65) });
  events.alarm.fire({ name: "drop-ads:list-refresh\u2028" });
  await registration.whenIdle();
  assert.equal(syncs, 0);

  events.runtimeMessage.fire({ type: "drop-ads:set-enabled" });
  await registration.whenIdle();
  assert.equal(syncs, 1);

  events.contextClicked.fire({ menuItemId: "drop-ads:block-default" });
  await registration.whenIdle();
  assert.equal(syncs, 2);

  events.alarm.fire({ name: "drop-ads:list-refresh" });
  await registration.whenIdle();
  assert.equal(syncs, 3);

  registration.dispose();
});
