import test from "node:test";
import assert from "node:assert/strict";
import { snapshotDenseDataArray } from "../src/core/object-schema.js";

test("dense array snapshots reject custom array prototypes", () => {
  const value = ["a"];
  Object.setPrototypeOf(value, { inherited: true });
  assert.throws(() => snapshotDenseDataArray(value, "Candidates", 4), /normal dense array/i);
});

test("dense array snapshots contain prototype traps", () => {
  const value = new Proxy(["a"], { getPrototypeOf() { throw new Error("trap"); } });
  assert.throws(() => snapshotDenseDataArray(value, "Candidates", 4), /normal dense array/i);
});

test("dense array snapshots still accept normal arrays and detach entries", () => {
  const value = ["a", "b"];
  const snapshot = snapshotDenseDataArray(value, "Candidates", 2);
  value[0] = "changed";
  assert.deepEqual(snapshot, ["a", "b"]);
});
