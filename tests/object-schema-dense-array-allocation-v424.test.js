import test from "node:test";
import assert from "node:assert/strict";
import { snapshotDenseDataArray } from "../src/core/object-schema.js";

test("dense-array admission rejects a huge sparse array from own-key metadata before index scanning", () => {
  const sparse = [];
  sparse.length = 1_000_000;
  sparse[0] = "first";
  assert.throws(
    () => snapshotDenseDataArray(sparse, "Sparse candidate", Number.MAX_SAFE_INTEGER),
    /dense array indices/
  );
});

test("dense-array admission still detaches valid normal dense arrays", () => {
  const source = ["a", "b", "c"];
  const snapshot = snapshotDenseDataArray(source, "Dense candidate", 3);
  assert.deepEqual(snapshot, source);
  assert.notEqual(snapshot, source);
});

test("dense-array admission rejects noncanonical extra keys without truncation", () => {
  const source = ["a"];
  source.extra = true;
  assert.throws(() => snapshotDenseDataArray(source, "Extra-key candidate", 8), /dense array indices/);
});
