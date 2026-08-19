import test from "node:test";
import assert from "node:assert/strict";

import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";

function listenerEvent({ throwAfterAdd = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) {
      assert.equal(this.listeners, listeners);
      listeners.add(listener);
      if (throwAfterAdd) throw new Error("registration failed");
    },
    removeListener(listener) {
      assert.equal(this.listeners, listeners);
      listeners.delete(listener);
    }
  };
}

function apiWithEvents(runtimeEvent, storageEvent) {
  return {
    runtime: { onMessage: runtimeEvent },
    storage: { onChanged: storageEvent },
    tabs: { async query() { return []; } }
  };
}

test("M441 cosmetic runtime disposes through captured event collaborators", () => {
  const runtimeEvent = listenerEvent();
  const storageEvent = listenerEvent();
  const api = apiWithEvents(runtimeEvent, storageEvent);
  const runtime = installCosmeticRuntime({ api });
  assert.equal(runtimeEvent.listeners.size, 1);
  assert.equal(storageEvent.listeners.size, 1);

  runtimeEvent.removeListener = () => { throw new Error("later runtime mutation must not be observed"); };
  storageEvent.removeListener = () => { throw new Error("later storage mutation must not be observed"); };
  api.runtime.onMessage = listenerEvent();
  api.storage.onChanged = listenerEvent();

  runtime.dispose();
  assert.equal(runtimeEvent.listeners.size, 0);
  assert.equal(storageEvent.listeners.size, 0);
});

test("M441 second-listener registration failure rolls back exact listener ownership", () => {
  const runtimeEvent = listenerEvent();
  const storageEvent = listenerEvent({ throwAfterAdd: true });
  const api = apiWithEvents(runtimeEvent, storageEvent);

  assert.throws(() => installCosmeticRuntime({ api }), /registration failed/);
  assert.equal(runtimeEvent.listeners.size, 0);
  assert.equal(storageEvent.listeners.size, 0);

  const replacementStorageEvent = listenerEvent();
  api.storage.onChanged = replacementStorageEvent;
  const runtime = installCosmeticRuntime({ api });
  assert.equal(runtimeEvent.listeners.size, 1);
  assert.equal(replacementStorageEvent.listeners.size, 1);
  runtime.dispose();
});
