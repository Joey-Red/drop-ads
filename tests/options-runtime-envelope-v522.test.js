import assert from "node:assert/strict";
import test from "node:test";

import { MAX_SETTINGS_RUNTIME_MESSAGE_FIELDS, sendOptionsRuntimeMessage } from "../src/core/options-runtime.js";

function makeApi(onSend) {
  const runtime = Object.create(null);
  Object.defineProperty(runtime, "sendMessage", {
    enumerable: true,
    value(message) {
      assert.equal(this, runtime);
      return onSend(message);
    }
  });
  const api = Object.create(null);
  Object.defineProperty(api, "runtime", { enumerable: true, value: runtime });
  return api;
}

test("Settings runtime sender dispatches a frozen null-prototype top-level snapshot", async () => {
  const nested = { id: "example" };
  const original = { type: "drop-ads:test", enabled: true, nested };
  const keysBefore = Reflect.ownKeys(original);
  const response = await sendOptionsRuntimeMessage(makeApi((message) => {
    assert.equal(Object.getPrototypeOf(message), null);
    assert.equal(Object.isFrozen(message), true);
    assert.equal(message.type, original.type);
    assert.equal(message.enabled, true);
    assert.equal(message.nested, nested);
    assert.notEqual(message, original);
    return "ok";
  }), original);
  assert.equal(response, "ok");
  assert.deepEqual(Reflect.ownKeys(original), keysBefore);
  assert.equal(Object.isFrozen(original), false);
});

test("Settings runtime sender accepts null-prototype data envelopes", () => {
  const message = Object.assign(Object.create(null), { type: "drop-ads:test" });
  assert.equal(sendOptionsRuntimeMessage(makeApi((sent) => sent.type), message), "drop-ads:test");
});

test("Settings runtime sender rejects top-level accessors without executing them", () => {
  let getterCalls = 0;
  const message = {};
  Object.defineProperty(message, "type", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "drop-ads:test";
    }
  });
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), message), /data properties/);
  assert.equal(getterCalls, 0);
});

test("Settings runtime sender rejects symbols, custom prototypes, and over-field envelopes", () => {
  const symbolMessage = { type: "drop-ads:test" };
  symbolMessage[Symbol("private")] = true;
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), symbolMessage), /symbol fields/);

  const customPrototype = Object.create({ inherited: true });
  customPrototype.type = "drop-ads:test";
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), customPrototype), /ordinary or null-prototype/);

  const tooMany = {};
  for (let index = 0; index <= MAX_SETTINGS_RUNTIME_MESSAGE_FIELDS; index += 1) tooMany[`field${index}`] = index;
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), tooMany), /exceeds/);
});

test("Settings runtime sender contains prototype, key, and descriptor traps", () => {
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("trap"); } });
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), prototypeTrap), /not safely inspectable/);

  const keyTrap = new Proxy({}, { ownKeys() { throw new Error("trap"); } });
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), keyTrap), /not safely inspectable/);

  const descriptorTrap = new Proxy({ type: "drop-ads:test" }, {
    getOwnPropertyDescriptor() { throw new Error("trap"); }
  });
  assert.throws(() => sendOptionsRuntimeMessage(makeApi(() => undefined), descriptorTrap), /fields are not safely inspectable/);
});
