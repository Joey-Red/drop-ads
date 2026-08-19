import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function apiWithEvent(event) {
  return {
    storage: { local: { async get() { return {}; } }, onChanged: event },
    declarativeNetRequest: { async setExtensionActionOptions() {} }
  };
}

test("M429 action-count event method accessors are rejected without getter execution", () => {
  let getterCalls = 0;
  const event = {};
  Object.defineProperty(event, "addListener", {
    enumerable: true,
    get() { getterCalls += 1; return () => {}; }
  });
  assert.throws(() => installActionCount({ api: apiWithEvent(event) }), /addListener must be a data function/);
  assert.equal(getterCalls, 0);
});

test("M429 disposal uses the remover captured at installation", async () => {
  const listeners = new Set();
  let originalRemovals = 0;
  const event = {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { originalRemovals += 1; listeners.delete(listener); }
  };
  const api = apiWithEvent(event);
  const registration = installActionCount({ api });
  await registration.whenIdle();
  assert.equal(listeners.size, 1);

  event.removeListener = () => { throw new Error("mutated remover must not run"); };
  assert.doesNotThrow(() => registration.dispose());
  assert.equal(originalRemovals, 1);
  assert.equal(listeners.size, 0);

  const second = installActionCount({ api });
  assert.notEqual(second, registration);
  second.dispose();
});

test("M429 add-then-throw registration rolls back through the captured remover", () => {
  const listeners = new Set();
  let removals = 0;
  const event = {
    addListener(listener) { listeners.add(listener); throw new Error("register failed"); },
    removeListener(listener) { removals += 1; listeners.delete(listener); }
  };
  assert.throws(() => installActionCount({ api: apiWithEvent(event) }), /register failed/);
  assert.equal(removals, 1);
  assert.equal(listeners.size, 0);
});
