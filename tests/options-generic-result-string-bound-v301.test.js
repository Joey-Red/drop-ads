import test from "node:test";
import assert from "node:assert/strict";
import { unwrapOptionsRuntimeResponse } from "../src/core/options-boundary.js";
import { MAX_NETWORK_RULE_VALUE_CHARS } from "../src/core/rules.js";

const exact = "x".repeat(MAX_NETWORK_RULE_VALUE_CHARS);
const over = `${exact}x`;

function unwrap(result) {
  return unwrapOptionsRuntimeResponse({ ok: true, result }, "fallback");
}

test("generic Settings result accepts exact-bound strings recursively", () => {
  const root = unwrap(exact);
  assert.equal(root, exact);

  const nested = unwrap({ value: exact, list: [exact] });
  assert.equal(nested.value, exact);
  assert.equal(nested.list[0], exact);
  assert.equal(Object.isFrozen(nested), true);
  assert.equal(Object.isFrozen(nested.list), true);
});

test("generic Settings result rejects one-over strings at any depth", () => {
  assert.throws(() => unwrap(over), /string exceeds/);
  assert.throws(() => unwrap({ value: over }), /string exceeds/);
  assert.throws(() => unwrap({ list: [over] }), /string exceeds/);
});
