import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

class MessageEvent {
  constructor(events) {
    this.events = events;
  }
  addListener(listener) {
    this.events.push(["add", listener]);
  }
  removeListener(listener) {
    this.events.push(["remove", listener]);
  }
}

test("M458 captures runtime/onMessage and prototype event methods once", () => {
  const events = [];
  const onMessage = new MessageEvent(events);
  const runtime = { onMessage };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  const listener = () => false;

  guarded.runtime.onMessage.addListener(listener);
  MessageEvent.prototype.removeListener = function changedRemove() {
    events.push(["mutated-remove"]);
  };
  runtime.onMessage = { addListener() { throw new Error("late event replacement"); } };
  api.runtime = { onMessage: runtime.onMessage };
  guarded.runtime.onMessage.removeListener(listener);

  assert.equal(events[0][0], "add");
  assert.equal(events[1][0], "remove");
  assert.equal(events.some(([kind]) => kind === "mutated-remove"), false);
});

test("M458 rejects accessor runtime namespaces without executing getters", () => {
  let getterReads = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      getterReads += 1;
      return { onMessage: {} };
    }
  });

  assert.throws(() => createMessageGuardedApi(api, { group: "core" }), /data property/);
  assert.equal(getterReads, 0);
});

test("M458 rejects accessor onMessage events without executing getters", () => {
  let getterReads = 0;
  const runtime = {};
  Object.defineProperty(runtime, "onMessage", {
    enumerable: true,
    get() {
      getterReads += 1;
      return {};
    }
  });

  assert.throws(() => createMessageGuardedApi({ runtime }, { group: "core" }), /data property/);
  assert.equal(getterReads, 0);
});
