import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SETTINGS_GENERIC_RESULT_KEY_CHARS,
  unwrapOptionsRuntimeResponse
} from "../src/core/options-boundary.js";

function unwrap(result) {
  return unwrapOptionsRuntimeResponse({ ok: true, result }, "fallback");
}

test("M483 bounds generic-result object key text before path construction", () => {
  assert.equal(MAX_SETTINGS_GENERIC_RESULT_KEY_CHARS, 256);
  assert.throws(() => unwrap({ ["x".repeat(257)]: true }), /invalid field name/);
  assert.throws(() => unwrap({ "bad\nkey": true }), /invalid field name/);
  assert.throws(() => unwrap({ "bad\u007fkey": true }), /invalid field name/);
  assert.throws(() => unwrap({ "bad\u2028key": true }), /invalid field name/);
  assert.throws(() => unwrap({ "bad\u2029key": true }), /invalid field name/);
});

test("M483 preserves bounded prototype-looking ordinary data keys", () => {
  const result = Object.create(null);
  Object.defineProperty(result, "__proto__", { value: "ok", enumerable: true, configurable: true, writable: true });
  const snapshot = unwrap(result);
  assert.equal(Object.getPrototypeOf(snapshot), null);
  assert.equal(snapshot.__proto__, "ok");
});
