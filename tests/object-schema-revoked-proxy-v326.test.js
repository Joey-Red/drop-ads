import assert from "node:assert/strict";
import test from "node:test";

import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "../src/core/object-schema.js";

function revoked(target) {
  const pair = Proxy.revocable(target, {});
  pair.revoke();
  return pair.proxy;
}

test("readPlainDataField fails closed for revoked object and array proxies", () => {
  const expected = { safe: false, present: false, value: undefined };
  assert.deepEqual(readPlainDataField(revoked({ value: 1 }), "value"), expected);
  assert.deepEqual(readPlainDataField(revoked([1]), "0"), expected);
});

test("assertPlainExactObject converts revoked proxies to deterministic schema errors", () => {
  assert.throws(
    () => assertPlainExactObject(revoked({ value: 1 }), "Revoked object", new Set(["value"])),
    /plain object with inspectable fields/
  );
  assert.throws(
    () => assertPlainExactObject(revoked([1]), "Revoked array", new Set(["0"])),
    /plain object with inspectable fields/
  );
});

test("snapshotDenseDataArray converts revoked proxies to deterministic dense-array errors", () => {
  assert.throws(() => snapshotDenseDataArray(revoked([1]), "Revoked array", 4), /normal dense array/);
  assert.throws(() => snapshotDenseDataArray(revoked({ 0: 1, length: 1 }), "Revoked object", 4), /normal dense array/);
});

test("ordinary object and dense-array behavior remains unchanged", () => {
  assert.deepEqual(readPlainDataField({ value: 3 }, "value"), { safe: true, present: true, value: 3 });
  assert.equal(assertPlainExactObject(Object.assign(Object.create(null), { value: 3 }), "Null object", ["value"]).value, 3);
  assert.deepEqual(snapshotDenseDataArray(["a", "b"], "Dense", 2), ["a", "b"]);
});
