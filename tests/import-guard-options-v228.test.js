import test from "node:test";
import assert from "node:assert/strict";
import { createImportGuardedApi } from "../src/core/import-guard.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

test("import guard reads preflight from its data descriptor without a get trap", () => {
  const mock = createMockWebExtension();
  let gets = 0;
  const target = { preflight: async () => [] };
  const options = new Proxy(target, { get(obj, key, receiver) { gets += 1; return Reflect.get(obj, key, receiver); } });
  createImportGuardedApi(mock.api, options);
  assert.equal(gets, 0);
});

test("import guard keeps supplied and omitted preflight behavior", () => {
  const mock = createMockWebExtension();
  const supplied = async () => [];
  assert.ok(createImportGuardedApi(mock.api, { preflight: supplied }));
  assert.ok(createImportGuardedApi(mock.api));
  assert.throws(() => createImportGuardedApi(mock.api, { preflight: true }), /function/i);
});
