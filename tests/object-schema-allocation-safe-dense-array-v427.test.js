import test from "node:test";
import assert from "node:assert/strict";

import { snapshotDenseDataArray } from "../src/core/object-schema.js";

test("M427 dense arrays detach without retaining the caller array", () => {
  const source = [{ id: 1 }, "two", 3];
  const snapshot = snapshotDenseDataArray(source, "test array", 3);
  assert.deepEqual(snapshot, source);
  assert.notEqual(snapshot, source);
  source[1] = "changed";
  assert.equal(snapshot[1], "two");
});

test("M427 huge sparse arrays fail before detached proportional allocation", () => {
  const sparse = [];
  Object.defineProperty(sparse, "length", { value: 1_000_000, writable: true });
  assert.throws(
    () => snapshotDenseDataArray(sparse, "sparse array", 1_000_000),
    /dense array indices/
  );
});

test("M427 extra and noncanonical array properties fail closed", () => {
  const extra = ["ok"];
  extra.extra = true;
  assert.throws(() => snapshotDenseDataArray(extra, "extra array", 2), /dense array indices/);

  const noncanonical = ["ok"];
  Object.defineProperty(noncanonical, "01", { value: "bad", enumerable: true });
  assert.throws(() => snapshotDenseDataArray(noncanonical, "noncanonical array", 2), /dense array indices/);
});

test("M427 revoked proxies fail through the deterministic array boundary", () => {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  assert.throws(() => snapshotDenseDataArray(proxy, "revoked array", 1), /normal dense array/);
});
