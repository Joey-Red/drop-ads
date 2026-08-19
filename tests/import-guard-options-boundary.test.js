import assert from "node:assert/strict";
import test from "node:test";

import { createImportGuardedApi } from "../src/core/import-guard.js";

function mockApi() {
  let adds = 0;
  return {
    runtime: { onMessage: { addListener() { adds += 1; }, removeListener() {} } },
    adds() { return adds; }
  };
}

test("import guard options reject preflight accessors without invocation", () => {
  const api = mockApi();
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "preflight", { enumerable: true, get() { reads += 1; return async () => {}; } });
  assert.throws(() => createImportGuardedApi(api, options), /data field/);
  assert.equal(reads, 0);
  assert.equal(api.adds(), 0);
});

test("import guard options reject unknown and custom-prototype fields", () => {
  const api = mockApi();
  assert.throws(() => createImportGuardedApi(api, { telemetry: true }), /unsupported field/);
  assert.throws(() => createImportGuardedApi(api, Object.create({ preflight: async () => {} })), /plain object/);
  assert.equal(api.adds(), 0);
});

test("import guard options require preflight to be a function", () => {
  const api = mockApi();
  assert.throws(() => createImportGuardedApi(api, { preflight: "nope" }), /must be a function/);
  assert.equal(api.adds(), 0);
});

test("import guard accepts exact supplied preflight and default options", () => {
  const api = mockApi();
  assert.doesNotThrow(() => createImportGuardedApi(api, { preflight: async () => {} }));
  assert.doesNotThrow(() => createImportGuardedApi(api));
  assert.equal(api.adds(), 0);
});

test("null-prototype exact options remain supported", () => {
  const api = mockApi();
  const options = Object.create(null);
  options.preflight = async () => {};
  assert.doesNotThrow(() => createImportGuardedApi(api, options));
});
