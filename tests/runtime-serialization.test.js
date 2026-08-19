import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { RULE_TIERS } from "../src/core/rules.js";
import { LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });
const EXTERNAL_URL = "https://lists.example.test/serial.txt";
const GATE_URL = "https://lists.example.test/serialization-gate.txt";

function textResponse(text, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    redirected: false,
    status,
    headers: { get: () => null },
    async text() { return text; }
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function installedRuntime() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const base = createFixtureFetch();
  let refreshGate = null;

  const fetchImpl = async (url, options) => {
    const value = String(url);
    if (refreshGate && value === refreshGate.url) {
      refreshGate.started.resolve();
      await refreshGate.release.promise;
    }
    if (value === EXTERNAL_URL) return textResponse("0.0.0.0 serialized-external.example\n");
    if (value === GATE_URL) return textResponse("0.0.0.0 serialization-gate.example\n");
    return base.fetchImpl(url, options);
  };

  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();

  return {
    mock,
    runtime,
    armRefreshGate(url) {
      const started = deferred();
      const release = deferred();
      refreshGate = { url, started, release };
      return {
        started: started.promise,
        release() {
          refreshGate = null;
          release.resolve();
        }
      };
    }
  };
}

function candidate() {
  return {
    id: "external-serial",
    title: "Serialized external",
    format: "hosts",
    sourceUrl: EXTERNAL_URL,
    enabled: true
  };
}

function gateCandidate() {
  return {
    id: "serialization-gate",
    title: "Serialization gate",
    format: "hosts",
    sourceUrl: GATE_URL,
    enabled: true
  };
}

async function addGateSubscription(mock, runtime) {
  const result = await mock.sendMessage({ type: "drop-ads:add-subscription", subscription: gateCandidate() });
  await runtime.whenIdle();
  assert.equal(result.ok, true, result.error ?? "subscription add should succeed");
  assert.ok(mock.inspect.storageData[LIST_CACHE_KEY]["serialization-gate"]);
}

function hasDomain(mock, domain) {
  return [...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes(domain));
}

test("refresh queued first prevents a concurrent subscription add from committing against a stale cache snapshot", async () => {
  const { mock, runtime, armRefreshGate } = await installedRuntime();
  await addGateSubscription(mock, runtime);
  const gate = armRefreshGate(GATE_URL);
  const refreshPromise = mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await gate.started;

  let addSettled = false;
  const addPromise = mock.sendMessage({ type: "drop-ads:add-subscription", subscription: candidate() })
    .finally(() => { addSettled = true; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(addSettled, false, "subscription mutation must wait behind the in-flight refresh");

  gate.release();
  const [refreshResult, addResult] = await Promise.all([refreshPromise, addPromise]);
  await runtime.whenIdle();

  assert.equal(refreshResult.ok, true);
  assert.equal(addResult.ok, true, addResult.error ?? "subscription add should succeed");
  assert.ok(mock.inspect.storageData[STORAGE_KEY].subscriptions.some((item) => item.id === "external-serial"));
  assert.ok(mock.inspect.storageData[LIST_CACHE_KEY]["external-serial"]);
  assert.equal(hasDomain(mock, "serialized-external.example"), true);
});

test("refresh queued first cannot resurrect cache after a later serialized subscription removal", async () => {
  const { mock, runtime, armRefreshGate } = await installedRuntime();
  const added = await mock.sendMessage({ type: "drop-ads:add-subscription", subscription: candidate() });
  await runtime.whenIdle();
  assert.equal(added.ok, true, added.error ?? "subscription add should succeed");
  assert.ok(mock.inspect.storageData[LIST_CACHE_KEY]["external-serial"]);

  const gate = armRefreshGate(EXTERNAL_URL);
  const refreshPromise = mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await gate.started;

  let removeSettled = false;
  const removePromise = mock.sendMessage({ type: "drop-ads:remove-subscription", id: "external-serial" })
    .finally(() => { removeSettled = true; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(removeSettled, false, "removal must wait behind the in-flight refresh");

  gate.release();
  const [refreshResult, removeResult] = await Promise.all([refreshPromise, removePromise]);
  await runtime.whenIdle();

  assert.equal(refreshResult.ok, true);
  assert.equal(removeResult.ok, true);
  assert.equal(mock.inspect.storageData[STORAGE_KEY].subscriptions.some((item) => item.id === "external-serial"), false);
  assert.equal(Object.hasOwn(mock.inspect.storageData[LIST_CACHE_KEY], "external-serial"), false);
  assert.equal(hasDomain(mock, "serialized-external.example"), false);
});

test("refresh and local policy changes share the same serialization boundary", async () => {
  const { mock, runtime, armRefreshGate } = await installedRuntime();
  await addGateSubscription(mock, runtime);
  const gate = armRefreshGate(GATE_URL);
  const refreshPromise = mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await gate.started;

  let policySettled = false;
  const policyPromise = mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "serialized-personal.example" }
  }).finally(() => { policySettled = true; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(policySettled, false, "local policy mutation must wait behind the in-flight refresh");

  gate.release();
  await Promise.all([refreshPromise, policyPromise]);
  await runtime.whenIdle();

  assert.ok(mock.inspect.storageData[STORAGE_KEY].personalBlock.some((rule) => rule.value === "serialized-personal.example"));
  assert.ok([...mock.inspect.dynamicRules.values()].some((rule) =>
    rule.id >= RULE_TIERS.personalBlock.idStart
    && rule.id <= RULE_TIERS.personalBlock.idEnd
    && rule.condition.requestDomains?.includes("serialized-personal.example")));
});

test("refresh DNR repair failure leaves the committed cache and pre-attempt rules unchanged", async () => {
  const { mock, runtime } = await installedRuntime();
  const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const victimId = [...mock.inspect.dynamicRules.keys()][0];
  mock.inspect.dynamicRules.delete(victimId);
  const rulesBeforeAttempt = structuredClone([...mock.inspect.dynamicRules.values()]);
  mock.inspect.failNextDynamicUpdate();

  const result = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.equal(result.ok, false);
  assert.deepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBeforeAttempt);
});

test("refresh cache-persistence failure restores fingerprints without unnecessary DNR rollback when rules are unchanged", async () => {
  const { mock, runtime } = await installedRuntime();
  mock.inspect.storageData[LIST_CACHE_KEY]["drop-ads-default"].n = 0;
  const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const rulesBefore = structuredClone([...mock.inspect.dynamicRules.values()]);
  const dnrBefore = mock.inspect.dnrUpdates.length;
  mock.inspect.failNextLocalSet();

  const result = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.equal(result.ok, false);
  assert.deepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBefore);
  assert.equal(mock.inspect.dnrUpdates.length, dnrBefore);
});
