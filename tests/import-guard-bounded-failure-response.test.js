import test from "node:test";
import assert from "node:assert/strict";

import { createImportGuardedApi, MAX_IMPORT_GUARD_ERROR_CHARS } from "../src/core/import-guard.js";

function makeApi() {
  let rawListener = null;
  return {
    runtime: {
      onMessage: {
        addListener(listener) { rawListener = listener; },
        removeListener(listener) { if (rawListener === listener) rawListener = null; }
      }
    },
    listener() { return rawListener; }
  };
}

test("import preflight error accessors are not executed and fallback is bounded", async () => {
  let getterCalls = 0;
  const hostile = {};
  Object.defineProperty(hostile, "message", {
    get() {
      getterCalls += 1;
      return "do not read";
    }
  });
  const api = makeApi();
  const guarded = createImportGuardedApi(api, { preflight: async () => { throw hostile; } });
  guarded.runtime.onMessage.addListener(() => true);
  let response;
  assert.equal(api.listener()({ type: "drop-ads:import-settings", backupText: "{}" }, {}, (value) => { response = value; }), true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(getterCalls, 0);
  assert.deepEqual(response, { ok: false, error: "Settings import preflight failed" });
});

test("oversized own-data preflight text falls back and closed response channels are contained", async () => {
  const api = makeApi();
  const guarded = createImportGuardedApi(api, {
    preflight: async () => { throw { message: "x".repeat(MAX_IMPORT_GUARD_ERROR_CHARS + 1) }; }
  });
  guarded.runtime.onMessage.addListener(() => true);
  assert.equal(api.listener()({ type: "drop-ads:import-settings", backupText: "{}" }, {}, () => { throw new Error("closed"); }), true);
  await new Promise((resolve) => setTimeout(resolve, 0));
});
