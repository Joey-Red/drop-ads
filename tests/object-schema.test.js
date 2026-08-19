import test from "node:test";
import assert from "node:assert/strict";
import { assertPlainExactObject } from "../src/core/object-schema.js";

const ALLOWED = new Set(["kind", "value"]);

test("exact object schema accepts ordinary and null-prototype data objects", () => {
  const ordinary = { kind: "domain", value: "ads.example" };
  assert.equal(assertPlainExactObject(ordinary, "Rule", ALLOWED), ordinary);

  const nullPrototype = Object.assign(Object.create(null), ordinary);
  assert.equal(assertPlainExactObject(nullPrototype, "Rule", ALLOWED), nullPrototype);
});

test("exact object schema rejects arrays and custom prototypes", () => {
  assert.throws(() => assertPlainExactObject([], "Rule", ALLOWED), /plain object/);
  assert.throws(
    () => assertPlainExactObject(Object.create({ inherited: true }), "Rule", ALLOWED),
    /plain object/
  );
});

test("exact object schema rejects unsupported and symbol own fields", () => {
  assert.throws(
    () => assertPlainExactObject({ value: "x", zebra: true, alpha: true }, "Rule", ALLOWED),
    /unsupported field: alpha/
  );
  const withSymbol = { value: "x" };
  withSymbol[Symbol("hidden")] = true;
  assert.throws(() => assertPlainExactObject(withSymbol, "Rule", ALLOWED), /symbol field/);
});

test("exact object schema rejects non-enumerable fields", () => {
  const value = { kind: "domain" };
  Object.defineProperty(value, "value", { value: "ads.example", enumerable: false });
  assert.throws(() => assertPlainExactObject(value, "Rule", ALLOWED), /enumerable data field/);
});

test("exact object schema rejects getters without invoking them", () => {
  let invoked = false;
  const value = { kind: "domain" };
  Object.defineProperty(value, "value", {
    enumerable: true,
    get() {
      invoked = true;
      return "ads.example";
    }
  });
  assert.throws(() => assertPlainExactObject(value, "Rule", ALLOWED), /data field/);
  assert.equal(invoked, false);
});

test("exact object schema rejects setters and accessor pairs", () => {
  const setterOnly = { kind: "domain" };
  Object.defineProperty(setterOnly, "value", { enumerable: true, set() {} });
  assert.throws(() => assertPlainExactObject(setterOnly, "Rule", ALLOWED), /data field/);

  const accessorPair = { kind: "domain" };
  Object.defineProperty(accessorPair, "value", { enumerable: true, get() { return "x"; }, set() {} });
  assert.throws(() => assertPlainExactObject(accessorPair, "Rule", ALLOWED), /data field/);
});
