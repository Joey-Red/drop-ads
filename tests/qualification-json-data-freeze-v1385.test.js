import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneQualificationJsonData,
  stringifyQualificationJsonData
} from "../tools/qualification-json-data.mjs";

test("M1385 qualification JSON clones are recursively frozen null-prototype snapshots", () => {
  const cloned = cloneQualificationJsonData({ outer: { inner: "value" }, enabled: true });
  assert.equal(Object.getPrototypeOf(cloned), null);
  assert.equal(Object.getPrototypeOf(cloned.outer), null);
  assert.equal(Object.isFrozen(cloned), true);
  assert.equal(Object.isFrozen(cloned.outer), true);
  assert.throws(() => { cloned.outer.inner = "changed"; }, TypeError);
  assert.equal(cloned.outer.inner, "value");
});

test("M1385 freezing preserves canonical stringify bytes", () => {
  const value = { alpha: "beta", nested: { count: 3 } };
  assert.equal(
    stringifyQualificationJsonData(value),
    `${JSON.stringify(value, null, 2)}\n`
  );
});
