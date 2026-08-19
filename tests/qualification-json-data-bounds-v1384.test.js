import test from "node:test";
import assert from "node:assert/strict";
import { cloneQualificationJsonData } from "../tools/qualification-json-data.mjs";

test("M1384 qualification JSON accepts ordinary bounded scalar/object data", () => {
  const cloned = cloneQualificationJsonData({ alpha: "beta", count: 3, enabled: true, nested: { ok: null } });
  assert.equal(cloned.alpha, "beta");
  assert.equal(cloned.nested.ok, null);
});

test("M1384 qualification JSON rejects oversized scalar strings before stringify", () => {
  assert.throws(
    () => cloneQualificationJsonData({ value: "x".repeat(256 * 1024 + 1) }),
    /string byte limit/
  );
});

test("M1384 qualification JSON rejects oversized keys and field-heavy objects", () => {
  const oversizedKey = `${"k".repeat(257)}`;
  assert.throws(() => cloneQualificationJsonData({ [oversizedKey]: true }), /oversized field name/);
  const many = Object.fromEntries(Array.from({ length: 129 }, (_, index) => [`k${index}`, index]));
  assert.throws(() => cloneQualificationJsonData(many), /object field limit/);
});
