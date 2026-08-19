import test from "node:test";
import assert from "node:assert/strict";
import { assertPlainExactObject } from "../src/core/object-schema.js";

test("exact object validation converts prototype traps into validation errors", () => {
  const value = new Proxy({}, { getPrototypeOf() { throw new Error("trap"); } });
  assert.throws(() => assertPlainExactObject(value, "Proxy input", []), /plain object/i);
});

test("exact object validation converts ownKeys traps into validation errors", () => {
  const value = new Proxy({}, { ownKeys() { throw new Error("trap"); } });
  assert.throws(() => assertPlainExactObject(value, "Proxy input", []), /plain object|fields/i);
});

test("exact object validation converts descriptor traps into validation errors", () => {
  const value = new Proxy({ safe: true }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "safe") throw new Error("trap");
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => assertPlainExactObject(value, "Proxy input", ["safe"]), /safe.*data field|plain object|fields/i);
});

test("exact object validation still accepts ordinary and null-prototype data objects", () => {
  assert.equal(assertPlainExactObject({ safe: true }, "Input", ["safe"]).safe, true);
  const value = Object.create(null);
  value.safe = true;
  assert.equal(assertPlainExactObject(value, "Input", ["safe"]).safe, true);
});
