import test from "node:test";
import assert from "node:assert/strict";

import { snapshotDenseDataArray } from "../src/core/object-schema.js";

test("M444 dense arrays detach successfully and independently", () => {
  const input = ["a", "b"];
  const snapshot = snapshotDenseDataArray(input, "test array", 2);
  assert.deepEqual(snapshot, ["a", "b"]);
  input[0] = "changed";
  assert.equal(snapshot[0], "a");
});

test("M444 huge sparse arrays fail before a proportional detached result is needed", () => {
  const sparse = new Array(100_000_000);
  assert.throws(
    () => snapshotDenseDataArray(sparse, "huge sparse", 100_000_000),
    /dense array indices/
  );
});

test("M444 noncanonical extra index-like properties fail closed", () => {
  const input = ["a"];
  Object.defineProperty(input, "01", { value: "extra", enumerable: true });
  assert.throws(() => snapshotDenseDataArray(input, "extra index", 2), /dense array indices/);
});

test("M444 revoked Proxy array-kind inspection fails deterministically", () => {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  assert.throws(() => snapshotDenseDataArray(proxy, "revoked", 1), /normal dense array/);
});
