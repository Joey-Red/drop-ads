import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { LIST_CACHE_KEY } from "../src/core/storage.js";
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

test("a refresh prunes cache entries for subscriptions that no longer exist", async () => {
  const { mock, runtime } = await installedRuntime();
  const cache = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  cache["external-removed"] = {
    block: [{ kind: "domain", value: "stale.example" }],
    allow: [],
    nextRefreshAt: Number.MAX_SAFE_INTEGER
  };
  await mock.api.storage.local.set({ [LIST_CACHE_KEY]: cache });

  const status = await runtime.refreshListsOnce(false);
  await runtime.whenIdle();

  assert.equal(status, "updated");
  assert.equal(Object.hasOwn(mock.inspect.storageData[LIST_CACHE_KEY], "external-removed"), false);
});
