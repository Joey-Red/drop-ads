import test from "node:test";
import assert from "node:assert/strict";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { DEFAULT_STATE, STORAGE_KEY } from "../src/core/storage.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function runtimeListener() {
  const mock = createMockWebExtension({ initialStorage: { [STORAGE_KEY]: structuredClone(DEFAULT_STATE) } });
  installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });
  const [listener] = mock.events.runtimeMessage.listeners;
  assert.equal(typeof listener, "function");
  return listener;
}

test("cosmetic runtime does not invoke a type accessor", () => {
  const listener = runtimeListener();
  let reads = 0;
  const message = {};
  Object.defineProperty(message, "type", {
    enumerable: true,
    get() { reads += 1; return "drop-ads:get-cosmetic-policy"; }
  });
  assert.equal(listener(message, {}, () => {}), false);
  assert.equal(reads, 0);
});

test("cosmetic runtime rejects unexpected accessor fields without invoking them", () => {
  const listener = runtimeListener();
  let reads = 0;
  const message = { type: "drop-ads:get-cosmetic-policy" };
  Object.defineProperty(message, "unexpected", {
    enumerable: true,
    get() { reads += 1; return "nope"; }
  });
  assert.equal(listener(message, {}, () => {}), false);
  assert.equal(reads, 0);
});

test("cosmetic runtime rejects custom-prototype messages", () => {
  const listener = runtimeListener();
  const message = Object.create({ inherited: true });
  Object.defineProperty(message, "type", { enumerable: true, value: "drop-ads:get-cosmetic-policy" });
  assert.equal(listener(message, {}, () => {}), false);
});

test("cosmetic runtime rejects revoked proxy messages without throwing", () => {
  const listener = runtimeListener();
  const { proxy, revoke } = Proxy.revocable({ type: "drop-ads:get-cosmetic-policy" }, {});
  revoke();
  assert.doesNotThrow(() => {
    assert.equal(listener(proxy, {}, () => {}), false);
  });
});
