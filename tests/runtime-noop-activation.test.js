import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

function textResponse(body) {
  return {
    ok: true,
    redirected: false,
    status: 200,
    headers: {
      get(name) {
        return String(name).toLowerCase() === "content-type" ? "text/plain" : null;
      }
    },
    async text() { return body; }
  };
}

async function setup() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const base = createFixtureFetch();
  let clock = 1_000_000;
  let communityBody = "block domain community.same.example\n";

  const fetchImpl = async (url, options) => {
    const value = String(url);
    if (value.includes("raw.githubusercontent.com/Joey-Red/drop-ads")) {
      return textResponse(communityBody);
    }
    return base.fetchImpl(url, options);
  };

  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl,
    now: () => clock,
    logger: quietLogger
  }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();

  return {
    mock,
    runtime,
    advance(milliseconds = 1_000) { clock += milliseconds; },
    setCommunityBody(value) { communityBody = value; }
  };
}

test("identical-content refresh persists newer cache metadata without rewriting DNR", async () => {
  const { mock, runtime, advance } = await setup();
  const rulesBefore = structuredClone([...mock.inspect.dynamicRules.values()]);
  const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const dnrBefore = mock.inspect.dnrUpdates.length;
  const storageBefore = mock.inspect.storageChanges.length;

  advance();
  const result = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.deepEqual(result, { ok: true, status: "updated" });
  assert.equal(mock.inspect.dnrUpdates.length, dnrBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBefore);
  assert.notDeepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore, "refresh timestamps should advance");
  assert.equal(mock.inspect.storageChanges.length, storageBefore + 1, "only cache metadata should be persisted");
});

test("changed remote rules still perform exactly one managed DNR update before cache persistence", async () => {
  const { mock, runtime, advance, setCommunityBody } = await setup();
  const dnrBefore = mock.inspect.dnrUpdates.length;
  setCommunityBody("block domain community.changed.example\n");
  advance();

  const result = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.deepEqual(result, { ok: true, status: "updated" });
  assert.equal(mock.inspect.dnrUpdates.length, dnrBefore + 1);
  const rules = [...mock.inspect.dynamicRules.values()];
  assert.ok(rules.some((rule) => rule.condition.requestDomains?.includes("community.changed.example")));
  assert.equal(rules.some((rule) => rule.condition.requestDomains?.includes("community.same.example")), false);
});

test("policy edits while protection is globally disabled persist without empty-to-empty DNR rewrites", async () => {
  const { mock, runtime } = await setup();
  const disabled = await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  await runtime.whenIdle();
  assert.equal(disabled.ok, true);
  assert.equal([...mock.inspect.dynamicRules.values()].length, 0);

  const dnrBeforeEdit = mock.inspect.dnrUpdates.length;
  const added = await mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "disabled-edit.example" }
  });
  await runtime.whenIdle();

  assert.equal(added.ok, true);
  assert.equal(added.result.changed, true);
  assert.equal(mock.inspect.dnrUpdates.length, dnrBeforeEdit);
  assert.ok(mock.inspect.storageData[STORAGE_KEY].personalBlock.some((rule) => rule.value === "disabled-edit.example"));
  assert.equal([...mock.inspect.dynamicRules.values()].length, 0);
});

test("persistence failure after a no-op DNR decision rolls back fingerprints without a browser-rule write", async () => {
  const { mock, runtime } = await setup();
  await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  await runtime.whenIdle();
  const dnrBeforeFailure = mock.inspect.dnrUpdates.length;

  mock.inspect.failNextLocalSet();
  const failed = await mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "failed-disabled-edit.example" }
  });
  await runtime.whenIdle();

  assert.equal(failed.ok, false);
  assert.equal(mock.inspect.dnrUpdates.length, dnrBeforeFailure);
  assert.equal(mock.inspect.storageData[STORAGE_KEY].personalBlock.some((rule) => rule.value === "failed-disabled-edit.example"), false);

  const dnrBeforeEnable = mock.inspect.dnrUpdates.length;
  const enabled = await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: true });
  await runtime.whenIdle();
  assert.equal(enabled.ok, true);
  assert.equal(mock.inspect.dnrUpdates.length, dnrBeforeEnable + 1);
  assert.equal([...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes("failed-disabled-edit.example")), false);
});

test("explicit synchronization marks already-correct managed rules without rewriting them", async () => {
  const { mock, runtime } = await setup();
  const dnrBefore = mock.inspect.dnrUpdates.length;
  await runtime.syncRules();
  await runtime.whenIdle();
  assert.equal(mock.inspect.dnrUpdates.length, dnrBefore);
});
