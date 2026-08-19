import test from "node:test";
import assert from "node:assert/strict";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function logger() {
  return { log() {}, warn() {}, error() {} };
}

test("cosmetic runtime installation is idempotent per API object", () => {
  const mock = createMockWebExtension();
  const first = installCosmeticRuntime({ api: mock.api, logger: logger() });
  const second = installCosmeticRuntime({ api: mock.api, logger: logger() });
  assert.equal(second, first);
});

test("disposed cosmetic runtime rejects public work and stale listeners stay silent", async () => {
  const mock = createMockWebExtension({ initialTabs: [{ id: 9, url: "https://example.com/" }] });
  const runtime = installCosmeticRuntime({ api: mock.api, logger: logger() });
  runtime.dispose();
  runtime.dispose();

  await assert.rejects(
    () => runtime.currentPolicy({ url: "https://example.com/" }),
    /disposed/
  );

  const beforeMessages = mock.inspect.tabMessages.length;
  await mock.api.storage.local.set({ [STORAGE_KEY]: { enabled: true } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(mock.inspect.tabMessages.length, beforeMessages, "disposed storage listener must not broadcast");
});

test("cosmetic runtime can be cleanly reinstalled after disposal", () => {
  const mock = createMockWebExtension();
  const first = installCosmeticRuntime({ api: mock.api, logger: logger() });
  first.dispose();
  const second = installCosmeticRuntime({ api: mock.api, logger: logger() });
  assert.notEqual(second, first);
});
