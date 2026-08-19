import assert from "node:assert/strict";
import test from "node:test";

import { validateBackgroundRuntimeMessage } from "../src/core/message-contract.js";

function proxyWithoutGets(target, counter) {
  return new Proxy(target, {
    get(object, key, receiver) {
      counter.count += 1;
      return Reflect.get(object, key, receiver);
    }
  });
}

test("runtime message validation never performs normal top-level property gets", () => {
  const counter = { count: 0 };
  const message = proxyWithoutGets({ type: "drop-ads:set-enabled", enabled: true }, counter);
  assert.deepEqual(validateBackgroundRuntimeMessage(message, "core"), { handled: true, type: "drop-ads:set-enabled" });
  assert.equal(counter.count, 0);
});

test("runtime message validation does not execute type getters", () => {
  let calls = 0;
  const message = {};
  Object.defineProperty(message, "type", { enumerable: true, get() { calls += 1; return "drop-ads:get-ui-state"; } });
  assert.throws(() => validateBackgroundRuntimeMessage(message, "core"));
  assert.equal(calls, 0);
});

test("cosmetic top-level messages still route by group", () => {
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type: "drop-ads:get-cosmetic-policy" }, "cosmetic"),
    { handled: true, type: "drop-ads:get-cosmetic-policy" }
  );
  assert.deepEqual(
    validateBackgroundRuntimeMessage({ type: "drop-ads:get-cosmetic-policy" }, "core"),
    { handled: false, type: "drop-ads:get-cosmetic-policy" }
  );
});
