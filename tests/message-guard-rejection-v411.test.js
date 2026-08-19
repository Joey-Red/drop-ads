import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi, MAX_RUNTIME_MESSAGE_ERROR_CHARS } from "../src/core/message-contract.js";

function guardListener() {
  let wrapper;
  const api = {
    runtime: {
      onMessage: {
        addListener(listener) { wrapper = listener; },
        removeListener() {}
      }
    }
  };
  createMessageGuardedApi(api, { group: "core" }).runtime.onMessage.addListener(() => false);
  return () => wrapper;
}

test("M411 guard-generated rejection never exceeds the reviewed complete error ceiling", () => {
  const getWrapper = guardListener();
  const wrapper = getWrapper();
  let reply;
  const handled = wrapper({ type: "x" }, {}, (value) => { reply = value; });
  assert.equal(handled, true);
  assert.equal(reply.ok, false);
  assert.equal(typeof reply.error, "string");
  assert.ok(reply.error.length <= MAX_RUNTIME_MESSAGE_ERROR_CHARS);
});

test("M411 guard rejection delivery is best effort when sendResponse throws", () => {
  const wrapper = guardListener()();
  assert.doesNotThrow(() => {
    const handled = wrapper({ type: "x" }, {}, () => { throw new Error("closed response channel"); });
    assert.equal(handled, true);
  });
});

test("M411 hostile validation error metadata falls back without executing accessors", () => {
  const wrapper = guardListener()();
  let getterCalls = 0;
  const hostile = Object.create(null);
  Object.defineProperty(hostile, "type", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "drop-ads:get-ui-state";
    }
  });
  let reply;
  assert.doesNotThrow(() => wrapper(hostile, {}, (value) => { reply = value; }));
  assert.equal(getterCalls, 0);
  assert.equal(reply.ok, false);
  assert.ok(reply.error.length <= MAX_RUNTIME_MESSAGE_ERROR_CHARS);
});
