import test from "node:test";
import assert from "node:assert/strict";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { DEFAULT_STATE, LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

test("dispose suppresses queued and future storage-driven cosmetic refreshes", async () => {
  const mock = createMockWebExtension({
    initialStorage: { [STORAGE_KEY]: structuredClone(DEFAULT_STATE) },
    initialTabs: [{ id: 1 }, { id: 2 }]
  });
  const runtime = installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });

  const pendingWrite = mock.api.storage.local.set({ [LIST_CACHE_KEY]: {} });
  runtime.dispose();
  await pendingWrite;
  await runtime.whenIdle();
  assert.equal(mock.inspect.tabMessages.length, 0);

  await mock.api.storage.local.set({ [LIST_CACHE_KEY]: { later: true } });
  await runtime.whenIdle();
  assert.equal(mock.inspect.tabMessages.length, 0);
});

test("public cosmetic runtime operations reject after disposal", async () => {
  const mock = createMockWebExtension({ initialStorage: { [STORAGE_KEY]: structuredClone(DEFAULT_STATE) } });
  const runtime = installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });
  runtime.dispose();

  await assert.rejects(runtime.currentPolicy({ url: "https://example.com/" }), /disposed/);
  await assert.rejects(runtime.broadcastRefresh(), /disposed/);
  assert.throws(() => runtime.invalidatePolicyInputs(), /disposed/);
});
