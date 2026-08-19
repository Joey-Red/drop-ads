import assert from "node:assert/strict";
import test from "node:test";

import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function fixture() {
  const contextListeners = [];
  const storageListeners = [];
  const api = {
    contextMenus: {
      onClicked: {
        addListener(listener) { contextListeners.push(listener); },
        removeListener() {}
      }
    },
    storage: {
      onChanged: {
        addListener(listener) { storageListeners.push(listener); },
        removeListener() {}
      }
    },
    action: { async setTitle() {} }
  };
  return { api, contextListeners, storageListeners };
}

test("context feedback rejects option accessors without invoking getters", () => {
  const { api, contextListeners, storageListeners } = fixture();
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "api", {
    enumerable: true,
    get() {
      reads += 1;
      return api;
    }
  });
  assert.throws(() => installContextBlockFeedback(options), /data field/);
  assert.equal(reads, 0);
  assert.equal(contextListeners.length, 0);
  assert.equal(storageListeners.length, 0);
});

test("context feedback rejects unknown/custom-prototype options and invalid timers before listeners", () => {
  const { api, contextListeners, storageListeners } = fixture();
  assert.throws(() => installContextBlockFeedback({ api, history: [] }), /unsupported field/);
  assert.throws(() => installContextBlockFeedback(Object.assign(Object.create({}), { api })), /plain object/);
  assert.throws(() => installContextBlockFeedback({ api, pendingMs: 0 }), /between 1 and/);
  assert.throws(() => installContextBlockFeedback({ api, visibleMs: 60_001 }), /between 1 and/);
  assert.throws(() => installContextBlockFeedback({ api, setTimeoutImpl: null }), /timer implementations/);
  assert.equal(contextListeners.length, 0);
  assert.equal(storageListeners.length, 0);
});

test("context feedback defaults still install once", () => {
  const { api, contextListeners, storageListeners } = fixture();
  const first = installContextBlockFeedback({ api });
  const second = installContextBlockFeedback({ api });
  assert.equal(first, second);
  assert.equal(contextListeners.length, 1);
  assert.equal(storageListeners.length, 1);
  first.dispose();
});
