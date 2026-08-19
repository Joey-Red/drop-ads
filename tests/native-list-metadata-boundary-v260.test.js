import test from "node:test";
import assert from "node:assert/strict";

import { validateListMetadata } from "../src/core/lists.js";

test("native list metadata accepts ordinary and null-prototype canonical data", () => {
  assert.deepEqual(validateListMetadata({
    schemaVersion: 1,
    id: "drop-ads-default",
    title: "  Drop Ads Community  ",
    format: "drop-ads-v1"
  }), {
    schemaVersion: 1,
    id: "drop-ads-default",
    title: "Drop Ads Community",
    format: "drop-ads-v1"
  });

  const metadata = Object.assign(Object.create(null), {
    schemaVersion: 1,
    id: "x",
    title: "X",
    format: "drop-ads-v1"
  });
  assert.equal(validateListMetadata(metadata).id, "x");
});

test("native list metadata getters and normal get traps are never executed", () => {
  let getterRuns = 0;
  const accessor = {
    schemaVersion: 1,
    id: "x",
    format: "drop-ads-v1"
  };
  Object.defineProperty(accessor, "title", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return "X";
    }
  });
  assert.throws(() => validateListMetadata(accessor), /data field/);
  assert.equal(getterRuns, 0);

  let getRuns = 0;
  const proxy = new Proxy({
    schemaVersion: 1,
    id: "x",
    title: "X",
    format: "drop-ads-v1"
  }, {
    get(target, key, receiver) {
      getRuns += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.equal(validateListMetadata(proxy).title, "X");
  assert.equal(getRuns, 0);
});

test("native list metadata missing fields and descriptor changes fail closed", () => {
  assert.throws(() => validateListMetadata({
    schemaVersion: 1,
    id: "x",
    title: "X"
  }), /missing field: format/);

  let reads = 0;
  const proxy = new Proxy({
    schemaVersion: 1,
    id: "x",
    title: "X",
    format: "drop-ads-v1"
  }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "id") {
        reads += 1;
        if (reads > 1) throw new Error("changed");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => validateListMetadata(proxy), /data field|plain object/);
});
