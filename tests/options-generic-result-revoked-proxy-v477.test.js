import test from "node:test";
import assert from "node:assert/strict";

import { unwrapOptionsRuntimeResponse } from "../src/core/options-boundary.js";

function revokedObject() {
  const pair = Proxy.revocable({}, {});
  pair.revoke();
  return pair.proxy;
}

function revokedArray() {
  const pair = Proxy.revocable([], {});
  pair.revoke();
  return pair.proxy;
}

test("M477 contains revoked root generic-result array-kind inspection", () => {
  assert.throws(
    () => unwrapOptionsRuntimeResponse({ ok: true, result: revokedObject() }, "fallback"),
    /Settings runtime response\.result array kind is not safely inspectable/
  );
  assert.throws(
    () => unwrapOptionsRuntimeResponse({ ok: true, result: revokedArray() }, "fallback"),
    /Settings runtime response\.result array kind is not safely inspectable/
  );
});

test("M477 contains revoked nested generic-result array-kind inspection", () => {
  assert.throws(
    () => unwrapOptionsRuntimeResponse({ ok: true, result: { nested: revokedObject() } }, "fallback"),
    /Settings runtime response\.result\.nested array kind is not safely inspectable/
  );
});

test("M477 preserves ordinary dense generic-result arrays", () => {
  const result = unwrapOptionsRuntimeResponse(
    { ok: true, result: { nested: [1, "two", true, null] } },
    "fallback"
  );
  assert.deepEqual(result.nested, [1, "two", true, null]);
  assert.equal(Object.isFrozen(result.nested), true);
});
