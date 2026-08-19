import test from "node:test";
import assert from "node:assert/strict";
import { snapshotSourceQualificationIds, snapshotSourceQualificationOptions } from "../tools/source-qualification-input.mjs";

test("source qualification ids are snapshotted and frozen", () => {
  const ids = ["easylist", "easyprivacy"];
  const safe = snapshotSourceQualificationIds(ids);
  assert.deepEqual([...safe], ids);
  assert.equal(Object.isFrozen(safe), true);
});

test("source qualification ids reject getters, holes, extras, duplicates, and controls", () => {
  const getter = [];
  Object.defineProperty(getter, "0", { enumerable: true, get() { throw new Error("getter ran"); } });
  getter.length = 1;
  assert.throws(() => snapshotSourceQualificationIds(getter), /data property/);
  assert.throws(() => snapshotSourceQualificationIds(new Array(1)), /dense/);
  const extra = ["one"];
  extra.extra = true;
  assert.throws(() => snapshotSourceQualificationIds(extra), /dense/);
  assert.throws(() => snapshotSourceQualificationIds(["one", "one"]), /Duplicate/);
  assert.throws(() => snapshotSourceQualificationIds(["bad\nvalue"]), /invalid/);
});

test("source qualification options reject accessor and custom-prototype fields", () => {
  const accessor = {};
  Object.defineProperty(accessor, "ids", { enumerable: true, get() { throw new Error("getter ran"); } });
  assert.throws(() => snapshotSourceQualificationOptions(accessor), /data property/);
  assert.throws(() => snapshotSourceQualificationOptions(Object.create({ ids: [] })), /plain object/);
  assert.throws(() => snapshotSourceQualificationOptions({ ids: [], unexpected: true }), /fields are invalid/);
});
