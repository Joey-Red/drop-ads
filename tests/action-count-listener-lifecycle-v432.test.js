import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function storageEvent({ throwAdd = false, throwRemove = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) {
      listeners.add(listener);
      if (throwAdd) throw new Error("add failed");
    },
    removeListener(listener) {
      listeners.delete(listener);
      if (throwRemove) throw new Error("remove failed");
    }
  };
}

function makeApi(event) {
  return {
    storage: {
      local: { async get() { return {}; } },
      onChanged: event
    }
  };
}

test("M432 action-count listener registration rolls back an add-then-throw collaborator", () => {
  const event = storageEvent({ throwAdd: true });
  const api = makeApi(event);
  assert.throws(() => installActionCount({ api }), /add failed/);
  assert.equal(event.listeners.size, 0);
});

test("M432 disposal releases identity even when captured listener removal throws", () => {
  const event = storageEvent({ throwRemove: true });
  const api = makeApi(event);
  const first = installActionCount({ api });
  assert.equal(event.listeners.size, 1);
  assert.doesNotThrow(() => first.dispose());
  assert.equal(event.listeners.size, 0);

  event.removeListener = (listener) => event.listeners.delete(listener);
  const second = installActionCount({ api });
  assert.notEqual(second, first);
  second.dispose();
});

test("M432 missing optional storage surfaces still return a no-op registration", () => {
  const registration = installActionCount({ api: {} });
  assert.equal(typeof registration.dispose, "function");
  assert.doesNotThrow(() => registration.dispose());
});
