import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, diffManagedRules } from "../src/core/runtime.js";
import { ruleKey, RULE_TIERS } from "../src/core/rules.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

async function installedRuntime() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl: fixture.fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();
  return { mock, runtime };
}

test("managed rule diff changes only missing or changed ids", () => {
  const current = [
    { id: 1, priority: 1, action: { type: "block" }, condition: { requestDomains: ["same.example"] } },
    { id: 2, priority: 1, action: { type: "block" }, condition: { requestDomains: ["old.example"] } }
  ];
  const desired = [
    { id: 1, condition: { requestDomains: ["same.example"] }, action: { type: "block" }, priority: 1 },
    { id: 2, priority: 1, action: { type: "block" }, condition: { requestDomains: ["new.example"] } },
    { id: 3, priority: 1, action: { type: "allow" }, condition: { requestDomains: ["allow.example"] } }
  ];
  const delta = diffManagedRules(current, desired);
  assert.deepEqual(delta.removeRuleIds, [2]);
  assert.deepEqual(delta.addRules.map((rule) => rule.id), [2, 3]);
});

test("serialized UI snapshot observes a policy mutation queued immediately before it", async () => {
  const { mock, runtime } = await installedRuntime();
  const mutation = mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  const snapshot = mock.sendMessage({ type: "drop-ads:get-ui-state" });
  const [mutationResult, snapshotResult] = await Promise.all([mutation, snapshot]);
  await runtime.whenIdle();

  assert.equal(mutationResult.ok, true);
  assert.equal(snapshotResult.ok, true);
  assert.equal(snapshotResult.result.state.enabled, false);
});

test("list download I/O cannot wedge UI state or the global master switch", async () => {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  let releaseRemote;
  let signalRemoteStarted;
  const remoteStarted = new Promise((resolve) => { signalRemoteStarted = resolve; });
  const remoteGate = new Promise((resolve) => { releaseRemote = resolve; });
  const fetchImpl = async (url, options) => {
    if (String(url).startsWith("https://")) {
      signalRemoteStarted();
      await remoteGate;
    }
    return fixture.fetchImpl(url, options);
  };
  const runtime = createBackgroundRuntime({ api: mock.api, fetchImpl, now: () => 1_000_000, logger: quietLogger }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await remoteStarted;

  try {
    const snapshot = await Promise.race([
      mock.sendMessage({ type: "drop-ads:get-ui-state" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("UI snapshot waited for list I/O")), 100))
    ]);
    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.result.state.enabled, true);

    const disabled = await Promise.race([
      mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("master switch waited for list I/O")), 100))
    ]);
    assert.equal(disabled.ok, true);
    assert.equal(mock.inspect.storageData.dropAdsState.enabled, false);
    assert.equal(mock.inspect.dynamicRules.size, 0);
  } finally {
    releaseRemote();
  }

  await runtime.whenIdle();
  assert.equal(mock.inspect.storageData.dropAdsState.enabled, false);
  assert.equal(mock.inspect.dynamicRules.size, 0, "completed refresh must respect the committed off state");
});

test("authoritative UI reads repair stale managed rules while global blocking is off", async () => {
  const { mock, runtime } = await installedRuntime();
  await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  await runtime.whenIdle();
  await mock.api.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: RULE_TIERS.communityBlock.idStart,
      priority: 1,
      action: { type: "block" },
      condition: { requestDomains: ["stale-managed.example"] }
    }]
  });
  assert.equal(mock.inspect.dynamicRules.size, 1);

  const snapshot = await mock.sendMessage({ type: "drop-ads:get-ui-state" });
  await runtime.whenIdle();
  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.result.state.enabled, false);
  assert.equal(mock.inspect.dynamicRules.size, 0);
});

test("personal rule add/remove never resend unchanged shared-rule tiers", async () => {
  const { mock, runtime } = await installedRuntime();
  mock.inspect.dnrUpdates.length = 0;

  const rule = { kind: "domain", value: "fast-personal.example" };
  const added = await mock.sendMessage({ type: "drop-ads:add-personal-rule", field: "personalBlock", rule });
  await runtime.whenIdle();
  assert.equal(added.ok, true);
  assert.equal(mock.inspect.dnrUpdates.length, 1);

  const addDelta = mock.inspect.dnrUpdates[0];
  assert.ok(addDelta.addRules.length > 0);
  assert.ok(addDelta.addRules.every((item) => item.id >= RULE_TIERS.personalBlock.idStart && item.id <= RULE_TIERS.personalBlock.idEnd));
  assert.ok(addDelta.removeRuleIds.every((id) => id >= RULE_TIERS.personalBlock.idStart && id <= RULE_TIERS.personalBlock.idEnd));

  mock.inspect.dnrUpdates.length = 0;
  const removed = await mock.sendMessage({
    type: "drop-ads:remove-personal-rule",
    field: "personalBlock",
    key: ruleKey(rule)
  });
  await runtime.whenIdle();
  assert.equal(removed.ok, true);
  assert.equal(mock.inspect.dnrUpdates.length, 1);

  const removeDelta = mock.inspect.dnrUpdates[0];
  assert.ok(removeDelta.addRules.every((item) => item.id >= RULE_TIERS.personalBlock.idStart && item.id <= RULE_TIERS.personalBlock.idEnd));
  assert.ok(removeDelta.removeRuleIds.length > 0);
  assert.ok(removeDelta.removeRuleIds.every((id) => id >= RULE_TIERS.personalBlock.idStart && id <= RULE_TIERS.personalBlock.idEnd));
});
