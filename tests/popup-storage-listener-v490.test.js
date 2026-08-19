import assert from "node:assert/strict";
import test from "node:test";

import { installPopupStorageListener, MAX_POPUP_COLLABORATOR_PROTOTYPE_DEPTH } from "../src/core/popup-boundary.js";

test("popup storage listener preserves event receiver and exact identity through teardown", () => {
  let registered = null;
  let removed = null;
  const event = Object.create(null);
  Object.defineProperties(event, {
    addListener: {
      enumerable: true,
      value(listener) {
        assert.equal(this, event);
        registered = listener;
      }
    },
    removeListener: {
      enumerable: true,
      value(listener) {
        assert.equal(this, event);
        removed = listener;
      }
    }
  });
  const storage = Object.create(null);
  Object.defineProperty(storage, "onChanged", { enumerable: true, value: event });
  const api = Object.create(null);
  Object.defineProperty(api, "storage", { enumerable: true, value: storage });
  const listener = () => {};

  const dispose = installPopupStorageListener(api, listener);
  assert.equal(typeof dispose, "function");
  assert.equal(registered, listener);
  assert.equal(dispose(), true);
  assert.equal(removed, listener);
  assert.equal(dispose(), false);
});

test("popup storage listener admits bounded prototype data properties", () => {
  let registered = false;
  let removed = false;
  const event = Object.create({
    addListener() { assert.equal(this, event); registered = true; },
    removeListener() { assert.equal(this, event); removed = true; }
  });
  const storage = Object.create({ onChanged: event });
  const api = Object.create({ storage });

  const dispose = installPopupStorageListener(api, () => {});
  assert.equal(registered, true);
  assert.equal(MAX_POPUP_COLLABORATOR_PROTOTYPE_DEPTH, 8);
  assert.equal(dispose(), true);
  assert.equal(removed, true);
});

test("popup storage listener rejects accessor collaborators without executing them", () => {
  let getterCalls = 0;
  const api = Object.create(null);
  Object.defineProperty(api, "storage", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return {};
    }
  });

  assert.throws(() => installPopupStorageListener(api, () => {}), /data property/);
  assert.equal(getterCalls, 0);
});

test("popup storage listener contains descriptor traps", () => {
  const api = new Proxy({}, {
    getOwnPropertyDescriptor() {
      throw new Error("trap");
    }
  });
  assert.throws(() => installPopupStorageListener(api, () => {}), /not safely inspectable/);
});

test("popup storage listener teardown isolates browser removal failure", () => {
  const event = {
    addListener() {},
    removeListener() { throw new Error("closed"); }
  };
  const dispose = installPopupStorageListener({ storage: { onChanged: event } }, () => {});
  assert.equal(dispose(), false);
  assert.equal(dispose(), false);
});
