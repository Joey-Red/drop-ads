import test from "node:test";
import assert from "node:assert/strict";
import { readPlainDataField } from "../src/core/object-schema.js";

test("plain data field reader distinguishes present and absent data", () => {
  assert.deepEqual(readPlainDataField({ value: 3 }, "value"), { safe: true, present: true, value: 3 });
  assert.deepEqual(readPlainDataField({}, "value"), { safe: true, present: false, value: undefined });
  const nullProto = Object.create(null);
  nullProto.value = 4;
  assert.deepEqual(readPlainDataField(nullProto, "value"), { safe: true, present: true, value: 4 });
});

test("plain data field reader rejects accessors and custom prototypes without getter execution", () => {
  let reads = 0;
  const accessor = {};
  Object.defineProperty(accessor, "value", { enumerable: true, get() { reads += 1; return 1; } });
  assert.deepEqual(readPlainDataField(accessor, "value"), { safe: false, present: true, value: undefined });
  assert.equal(reads, 0);
  assert.deepEqual(readPlainDataField(Object.create({ value: 1 }), "value"), { safe: false, present: false, value: undefined });
});

test("plain data field reader contains Proxy prototype and descriptor traps", () => {
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("trap"); } });
  assert.deepEqual(readPlainDataField(prototypeTrap, "value"), { safe: false, present: false, value: undefined });
  const descriptorTrap = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("trap"); } });
  assert.deepEqual(readPlainDataField(descriptorTrap, "value"), { safe: false, present: false, value: undefined });
});
