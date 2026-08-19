import assert from "node:assert/strict";
import test from "node:test";

import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";

function event() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function fixture() {
  const onMessage = event();
  const onChanged = event();
  const api = {
    runtime: { onMessage },
    storage: { local: { async get() { return {}; }, async set() {} }, onChanged },
    tabs: { async query() { return []; }, async sendMessage() {} }
  };
  const runtime = installCosmeticRuntime({ api });
  return { api, runtime, listener: [...onMessage.listeners][0] };
}

test("cosmetic runtime rejects extra, symbol, hidden, and custom-prototype message fields", () => {
  const { runtime, listener } = fixture();
  assert.equal(listener({ type: "drop-ads:get-cosmetic-policy", extra: "history" }, { url: "https://example.com/" }, () => undefined), false);

  const symbolMessage = { type: "drop-ads:get-cosmetic-policy" };
  symbolMessage[Symbol("extra")] = true;
  assert.equal(listener(symbolMessage, { url: "https://example.com/" }, () => undefined), false);

  const hidden = { type: "drop-ads:get-cosmetic-policy" };
  Object.defineProperty(hidden, "extra", { enumerable: false, value: true });
  assert.equal(listener(hidden, { url: "https://example.com/" }, () => undefined), false);

  const custom = Object.assign(Object.create({ custom: true }), { type: "drop-ads:get-cosmetic-policy" });
  assert.equal(listener(custom, { url: "https://example.com/" }, () => undefined), false);
  runtime.dispose();
});

test("cosmetic runtime accepts an exact null-prototype get-policy message", async () => {
  const { runtime, listener } = fixture();
  const message = Object.assign(Object.create(null), { type: "drop-ads:get-cosmetic-policy" });
  let response;
  assert.equal(listener(message, { url: "https://example.com/" }, (value) => { response = value; }), true);
  await runtime.whenIdle();
  assert.equal(typeof response?.ok, "boolean");
  runtime.dispose();
});

test("cosmetic runtime rejects unknown types for other listeners", () => {
  const { runtime, listener } = fixture();
  assert.equal(listener({ type: "drop-ads:unknown" }, {}, () => undefined), false);
  runtime.dispose();
});
