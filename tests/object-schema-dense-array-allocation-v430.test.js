import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { snapshotDenseDataArray } from "../src/core/object-schema.js";

const source = fs.readFileSync(new URL("../src/core/object-schema.js", import.meta.url), "utf8");

test("M430 huge sparse arrays fail before detached length-proportional allocation", () => {
  const sparse = new Array(50_000_000);
  sparse[0] = "only";
  assert.throws(
    () => snapshotDenseDataArray(sparse, "Huge sparse", Number.MAX_SAFE_INTEGER),
    /dense array indices/
  );
});

test("M430 dense-array metadata no longer materializes every expected index", () => {
  assert.doesNotMatch(source, /Array\.from\(\{ length \}/);
  assert.doesNotMatch(source, /new Set\(\["length", \.\.\.Array\.from/);
  assert.match(source, /if \(ownKeys\.length !== length \+ 1\)/);
  assert.match(source, /isCanonicalArrayIndexKey\(key, length\)/);
});

test("M430 normal dense arrays remain detached and extra keys fail", () => {
  const sourceArray = ["a", "b"];
  const snapshot = snapshotDenseDataArray(sourceArray, "Normal", 2);
  assert.deepEqual(snapshot, ["a", "b"]);
  sourceArray[0] = "changed";
  assert.equal(snapshot[0], "a");

  const extra = ["a"];
  extra.extra = true;
  assert.throws(() => snapshotDenseDataArray(extra, "Extra", 2), /dense array indices/);
});
