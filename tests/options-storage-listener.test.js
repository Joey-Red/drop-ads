import assert from "node:assert/strict";
import test from "node:test";

import { installOwnedOptionsStorageListener } from "../src/core/options-storage-listener.js";

function makeApi({ removeThrows = false } = {}) {
  const calls = [];
  const onChanged = {
    addListener(listener) {
      assert.equal(this, onChanged);
      calls.push(["add", listener]);
    },
    removeListener(listener) {
      assert.equal(this, onChanged);
      calls.push(["remove", listener]);
      if (removeThrows) throw new Error("remove failed");
    }
  };
  return { api: { storage: { onChanged } }, calls, onChanged };
}

test("owned Settings storage listener preserves receiver and exact listener identity", () => {
  const { api, calls } = makeApi();
  const listener = () => {};
  const dispose = installOwnedOptionsStorageListener(api, listener);
  assert.deepEqual(calls, [["add", listener]]);
  assert.equal(dispose(), true);
  assert.deepEqual(calls, [["add", listener], ["remove", listener]]);
  assert.equal(dispose(), false);
  assert.equal(calls.length, 2);
});

test("owned Settings storage listener teardown is best effort", () => {
  const { api, calls } = makeApi({ removeThrows: true });
  const listener = () => {};
  const dispose = installOwnedOptionsStorageListener(api, listener);
  assert.equal(dispose(), false);
  assert.equal(dispose(), false);
  assert.deepEqual(calls.map(([kind]) => kind), ["add", "remove"]);
});

test("owned Settings storage listener validates both collaborators before registration", () => {
  let added = false;
  const listener = () => {};
  assert.throws(() => installOwnedOptionsStorageListener({
    storage: { onChanged: { addListener() { added = true; } } }
  }, listener), /removeListener/);
  assert.equal(added, false);

  assert.throws(() => installOwnedOptionsStorageListener({
    storage: { onChanged: { addListener: 1, removeListener() {} } }
  }, listener), /addListener/);

  const accessor = {};
  Object.defineProperty(accessor, "removeListener", { get() { throw new Error("getter ran"); } });
  accessor.addListener = () => {};
  assert.throws(() => installOwnedOptionsStorageListener({ storage: { onChanged: accessor } }, listener), /data property/);
});

test("owned Settings storage listener contains descriptor and prototype traps", () => {
  const listener = () => {};
  const trappedEvent = new Proxy({}, {
    getOwnPropertyDescriptor() { throw new Error("descriptor trap"); }
  });
  assert.throws(() => installOwnedOptionsStorageListener({ storage: { onChanged: trappedEvent } }, listener), /safely inspectable/);

  const noOwn = {};
  const trappedProto = new Proxy(noOwn, {
    getPrototypeOf() { throw new Error("prototype trap"); }
  });
  assert.throws(() => installOwnedOptionsStorageListener({ storage: { onChanged: trappedProto } }, listener), /prototype is not safely inspectable/);
});
