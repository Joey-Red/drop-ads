import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_COUNT_PREFERENCE_KEY, installActionCount } from "../src/core/action-count.js";

function poisonBind(fn) {
  Object.defineProperty(fn, "bind", {
    configurable: true,
    get() { throw new Error("callback-owned bind must not be read"); }
  });
  return fn;
}

function makeStorageEvent() {
  const listeners = new Set();
  let adds = 0;
  let removes = 0;
  const event = {};
  event.addListener = poisonBind(function addListener(listener) {
    assert.equal(this, event);
    adds += 1;
    listeners.add(listener);
  });
  event.removeListener = poisonBind(function removeListener(listener) {
    assert.equal(this, event);
    removes += 1;
    listeners.delete(listener);
  });
  return { event, listeners, get adds() { return adds; }, get removes() { return removes; } };
}

function makeApi(storageEvent) {
  const local = {
    get() { return Promise.resolve({ [ACTION_COUNT_PREFERENCE_KEY]: true }); },
    set() { return Promise.resolve(); }
  };
  return {
    storage: { local, onChanged: storageEvent },
    declarativeNetRequest: {
      setExtensionActionOptions() { return Promise.resolve(); }
    }
  };
}

test("M452 storage listener add/remove collaborators are captured once and preserve receiver", () => {
  const storageEvent = makeStorageEvent();
  const api = makeApi(storageEvent.event);
  const registration = installActionCount({ api });
  assert.equal(storageEvent.adds, 1);
  assert.equal(storageEvent.listeners.size, 1);

  storageEvent.event.removeListener = () => { throw new Error("mutated remover must not run"); };
  registration.dispose();
  assert.equal(storageEvent.removes, 1);
  assert.equal(storageEvent.listeners.size, 0);
});

test("M451 action-count namespace admission never executes accessor properties", () => {
  let storageGetterCalls = 0;
  const api = {};
  Object.defineProperty(api, "storage", {
    enumerable: true,
    get() {
      storageGetterCalls += 1;
      return {};
    }
  });

  assert.throws(() => installActionCount({ api }), /storage namespace.*data property/i);
  assert.equal(storageGetterCalls, 0);
});

test("M451 nested action-count namespaces reject accessors without execution", () => {
  let localGetterCalls = 0;
  const storage = { onChanged: makeStorageEvent().event };
  Object.defineProperty(storage, "local", {
    enumerable: true,
    get() {
      localGetterCalls += 1;
      return {};
    }
  });
  assert.throws(() => installActionCount({ api: { storage } }), /storage\.local namespace.*data property/i);
  assert.equal(localGetterCalls, 0);
});
