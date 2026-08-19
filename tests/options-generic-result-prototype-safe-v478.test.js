import test from "node:test";
import assert from "node:assert/strict";

import { unwrapOptionsRuntimeResponse } from "../src/core/options-boundary.js";

function resultWithPrototypeKeys() {
  const result = Object.create(null);
  Object.defineProperty(result, "__proto__", {
    value: { polluted: true },
    enumerable: true,
    writable: true,
    configurable: true
  });
  Object.defineProperty(result, "constructor", {
    value: "ordinary-data",
    enumerable: true,
    writable: true,
    configurable: true
  });
  result.nested = { ok: true };
  return result;
}

test("M478 preserves prototype-looking generic-result keys as own data", () => {
  const snapshot = unwrapOptionsRuntimeResponse(
    { ok: true, result: resultWithPrototypeKeys() },
    "fallback"
  );

  assert.equal(Object.getPrototypeOf(snapshot), null);
  assert.equal(Object.hasOwn(snapshot, "__proto__"), true);
  assert.equal(Object.hasOwn(snapshot, "constructor"), true);
  assert.equal(snapshot.constructor, "ordinary-data");
  assert.equal(snapshot.__proto__.polluted, true);
  assert.equal(Object.getPrototypeOf(snapshot.nested), null);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.nested), true);
});

test("M478 does not pollute Object.prototype", () => {
  unwrapOptionsRuntimeResponse({ ok: true, result: resultWithPrototypeKeys() }, "fallback");
  assert.equal(Object.prototype.polluted, undefined);
});
