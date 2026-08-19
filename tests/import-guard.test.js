import test from "node:test";
import assert from "node:assert/strict";
import { assertImportRemoteActivationBudget, createImportGuardedApi, MAX_IMPORT_REMOTE_ACTIVATIONS, pendingImportRemoteActivations } from "../src/core/import-guard.js";
import { encodeCacheEntry } from "../src/core/cache-codec.js";
import { subscriptionSourceKey } from "../src/core/subscriptions.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function subscription(index, { enabled = true, source = index } = {}) {
  return {
    id: `external-${index}`,
    title: `List ${index}`,
    format: "hosts",
    sourceUrl: `https://lists.example.com/${source}.txt`,
    enabled,
    builtIn: false
  };
}

function cacheEntryFor(subscriptionRecord) {
  return encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    sourceKey: subscriptionSourceKey(subscriptionRecord)
  }, 0);
}

const currentState = { subscriptions: [] };
const currentCache = {};

test("remote activation budget accepts exact limit and rejects one over", () => {
  const exact = { subscriptions: Array.from({ length: MAX_IMPORT_REMOTE_ACTIVATIONS }, (_, index) => subscription(index)) };
  assert.equal(assertImportRemoteActivationBudget(exact, currentState, currentCache).length, MAX_IMPORT_REMOTE_ACTIVATIONS);

  const over = { subscriptions: Array.from({ length: MAX_IMPORT_REMOTE_ACTIVATIONS + 1 }, (_, index) => subscription(index)) };
  assert.throws(() => assertImportRemoteActivationBudget(over, currentState, currentCache), /uncached enabled filter sources/);
});

test("disabled and exact-provenance cached sources do not consume import activation budget", () => {
  const existingSubscription = subscription(1, { source: "shared" });
  const existing = { subscriptions: [existingSubscription] };
  const cache = { "external-1": cacheEntryFor(existingSubscription) };
  const candidate = {
    subscriptions: [
      subscription(20, { source: "shared" }),
      subscription(21, { enabled: false, source: "disabled" }),
      subscription(22, { source: "missing" })
    ]
  };
  const pending = pendingImportRemoteActivations(candidate, existing, cache);
  assert.deepEqual(pending.map((item) => item.id), ["external-22"]);
});

test("source-less or mismatched cache entries cannot prove reusable import provenance", () => {
  const existingSubscription = subscription(1, { source: "shared" });
  const existing = { subscriptions: [existingSubscription] };
  const candidate = { subscriptions: [subscription(20, { source: "shared" })] };
  const sourceLess = encodeCacheEntry({ block: [{ kind: "domain", value: "ads.example" }], allow: [] }, 0);
  const mismatched = cacheEntryFor(subscription(99, { source: "other" }));
  assert.equal(pendingImportRemoteActivations(candidate, existing, { "external-1": sourceLess }).length, 1);
  assert.equal(pendingImportRemoteActivations(candidate, existing, { "external-1": mismatched }).length, 1);
});

test("guard rejects import before delegating to runtime listener", async () => {
  const mock = createMockWebExtension();
  let delegated = 0;
  const guardedApi = createImportGuardedApi(mock.api, {
    async preflight() { throw new Error("too many uncached sources"); }
  });
  guardedApi.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
    delegated += 1;
    sendResponse({ ok: true });
    return true;
  });

  const result = await mock.sendMessage({ type: "drop-ads:import-settings", backupText: "{}" });
  assert.equal(result.ok, false);
  assert.match(result.error, /too many uncached sources/);
  assert.equal(delegated, 0);
});

test("guard delegates non-import messages without running import preflight", async () => {
  const mock = createMockWebExtension();
  let preflights = 0;
  const guardedApi = createImportGuardedApi(mock.api, { async preflight() { preflights += 1; } });
  guardedApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    sendResponse({ ok: true, type: message.type });
    return true;
  });
  const result = await mock.sendMessage({ type: "drop-ads:get-ui-state" });
  assert.deepEqual(result, { ok: true, type: "drop-ads:get-ui-state" });
  assert.equal(preflights, 0);
});
