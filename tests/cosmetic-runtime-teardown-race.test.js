import test from "node:test";
import assert from "node:assert/strict";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

const quietLogger = { log() {}, warn() {}, error() {} };

test("disposing during an in-flight cosmetic state read prevents later persistence", async () => {
  const mock = createMockWebExtension();
  const gate = deferred();
  const originalGet = mock.api.storage.local.get.bind(mock.api.storage.local);
  let blockedReads = 0;
  mock.api.storage.local.get = async (key) => {
    if (key === STORAGE_KEY) {
      blockedReads += 1;
      await gate.promise;
    }
    return originalGet(key);
  };

  const runtime = installCosmeticRuntime({ api: mock.api, logger: quietLogger });
  const operation = runtime.addRule("personalCosmeticHide", { selector: ".late-ad" });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(blockedReads, 1);

  runtime.dispose();
  gate.resolve();
  await assert.rejects(operation, /disposed/);
  assert.equal(mock.inspect.storageChanges.length, 0);
});

test("disposing during tab enumeration prevents cosmetic refresh messages", async () => {
  const mock = createMockWebExtension({ initialTabs: [{ id: 1, url: "https://example.com/" }] });
  const gate = deferred();
  const originalQuery = mock.api.tabs.query.bind(mock.api.tabs);
  mock.api.tabs.query = async (...args) => {
    await gate.promise;
    return originalQuery(...args);
  };

  const runtime = installCosmeticRuntime({ api: mock.api, logger: quietLogger });
  const operation = runtime.broadcastRefresh();
  await Promise.resolve();
  runtime.dispose();
  gate.resolve();
  await assert.rejects(operation, /disposed/);
  assert.deepEqual(mock.inspect.tabMessages, []);
});
