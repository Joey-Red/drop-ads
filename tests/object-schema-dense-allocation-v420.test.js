import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { snapshotDenseDataArray } from "../src/core/object-schema.js";

const source = fs.readFileSync(new URL("../src/core/object-schema.js", import.meta.url), "utf8");

test("M420 dense-array admission no longer materializes expected indices", () => {
  assert.doesNotMatch(source, /Array\.from\(\{ length \}/);
  assert.doesNotMatch(source, /new Set\(\["length", \.\.\./);
  assert.match(source, /ownKeys\.length !== length \+ 1/);
  assert.match(source, /isCanonicalArrayIndexKey/);
});

test("M420 huge sparse arrays fail before detached result allocation", () => {
  const sparse = [];
  sparse.length = 100_000_000;
  assert.throws(
    () => snapshotDenseDataArray(sparse, "Huge sparse", Number.MAX_SAFE_INTEGER),
    /dense array indices/
  );
});

test("M420 canonical dense arrays retain detached semantics", () => {
  const sourceArray = ["a", "b"];
  const snapshot = snapshotDenseDataArray(sourceArray, "Dense", 2);
  assert.deepEqual(snapshot, ["a", "b"]);
  sourceArray[0] = "changed";
  assert.equal(snapshot[0], "a");
});
