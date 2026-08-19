import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { makeCacheEntry } from "../src/core/list-updates.js";
import { ruleKey, RULE_TIERS } from "../src/core/rules.js";
import { LIST_CACHE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });
const DOMAIN_COUNT = 55_000;

async function runtimeWithLargeSharedList() {
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

  const cache = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const block = Array.from({ length: DOMAIN_COUNT }, (_, index) => ({
    kind: "domain",
    value: `ad-${String(index).padStart(5, "0")}.large-list.test`
  }));
  cache["hagezi-pro-mini"] = makeCacheEntry({ block, allow: [] }, 1_000_000, 43_200_000);
  await mock.api.storage.local.set({ [LIST_CACHE_KEY]: cache });
  await runtime.syncRules();
  await runtime.whenIdle();
  mock.inspect.dnrUpdates.length = 0;
  return { mock, runtime };
}

function assertPersonalOnlyDelta(update) {
  const personal = (id) => id >= RULE_TIERS.personalBlock.idStart && id <= RULE_TIERS.personalBlock.idEnd;
  assert.ok(update.removeRuleIds.every(personal), "unchanged shared-list rule ids must never be removed");
  assert.ok(update.addRules.every((rule) => personal(rule.id)), "unchanged shared-list batches must never be resent");
}

test("HaGeZi-scale shared cache does not amplify personal add/remove DNR writes", async () => {
  const { mock, runtime } = await runtimeWithLargeSharedList();
  const sharedBefore = [...mock.inspect.dynamicRules.values()].filter((rule) =>
    rule.id >= RULE_TIERS.communityBlock.idStart && rule.id <= RULE_TIERS.communityBlock.idEnd);
  assert.ok(sharedBefore.length > 100, "synthetic large list should compile into many shared batches");

  const rule = { kind: "domain", value: "manual-fast-path.example" };
  const added = await mock.sendMessage({ type: "drop-ads:add-personal-rule", field: "personalBlock", rule });
  await runtime.whenIdle();
  assert.equal(added.ok, true);
  assert.equal(mock.inspect.dnrUpdates.length, 1);
  assertPersonalOnlyDelta(mock.inspect.dnrUpdates[0]);

  const sharedAfterAdd = [...mock.inspect.dynamicRules.values()].filter((item) =>
    item.id >= RULE_TIERS.communityBlock.idStart && item.id <= RULE_TIERS.communityBlock.idEnd);
  assert.deepEqual(sharedAfterAdd, sharedBefore);

  mock.inspect.dnrUpdates.length = 0;
  const removed = await mock.sendMessage({
    type: "drop-ads:remove-personal-rule",
    field: "personalBlock",
    key: ruleKey(rule)
  });
  await runtime.whenIdle();
  assert.equal(removed.ok, true);
  assert.equal(mock.inspect.dnrUpdates.length, 1);
  assertPersonalOnlyDelta(mock.inspect.dnrUpdates[0]);

  const sharedAfterRemove = [...mock.inspect.dynamicRules.values()].filter((item) =>
    item.id >= RULE_TIERS.communityBlock.idStart && item.id <= RULE_TIERS.communityBlock.idEnd);
  assert.deepEqual(sharedAfterRemove, sharedBefore);
});

test("UI snapshot behind a HaGeZi-scale mutation adds no extra DNR write", async () => {
  const { mock, runtime } = await runtimeWithLargeSharedList();
  const mutation = mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "snapshot-large-list.example" }
  });
  const snapshot = mock.sendMessage({ type: "drop-ads:get-ui-state" });
  const [mutationResult, snapshotResult] = await Promise.all([mutation, snapshot]);
  await runtime.whenIdle();

  assert.equal(mutationResult.ok, true);
  assert.equal(snapshotResult.ok, true);
  assert.ok(snapshotResult.result.state.personalBlock.some((rule) => rule.value === "snapshot-large-list.example"));
  assert.equal(mock.inspect.dnrUpdates.length, 1);
  assertPersonalOnlyDelta(mock.inspect.dnrUpdates[0]);
});
