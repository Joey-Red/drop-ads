import test from "node:test";
import assert from "node:assert/strict";

import { createImportGuardedApi, MAX_IMPORT_GUARD_ERROR_CHARS } from "../src/core/import-guard.js";

function makeApi() {
  let registered = null;
  const onMessage = {
    addListener(listener) { registered = listener; },
    removeListener(listener) { if (registered === listener) registered = null; }
  };
  return {
    api: { runtime: { onMessage } },
    registered: () => registered
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("M448 import guard does not execute error message accessors", async () => {
  const harness = makeApi();
  let getterCalls = 0;
  const hostile = {};
  Object.defineProperty(hostile, "message", {
    get() {
      getterCalls += 1;
      return "unsafe";
    }
  });
  const guarded = createImportGuardedApi(harness.api, { preflight: () => { throw hostile; } });
  guarded.runtime.onMessage.addListener(() => false);
  let response;
  assert.equal(harness.registered()({ type: "drop-ads:import-settings", backupText: "{}" }, {}, (value) => { response = value; }), true);
  await tick();
  assert.equal(getterCalls, 0);
  assert.deepEqual(response, { ok: false, error: "Settings import preflight failed" });
});

test("M448 oversized failure text falls back while normal Error text is preserved", async () => {
  for (const [error, expected] of [
    [new Error("source refused"), "source refused"],
    [Object.assign({}, { message: "x".repeat(MAX_IMPORT_GUARD_ERROR_CHARS + 1) }), "Settings import preflight failed"]
  ]) {
    const harness = makeApi();
    const guarded = createImportGuardedApi(harness.api, { preflight: () => { throw error; } });
    guarded.runtime.onMessage.addListener(() => false);
    let response;
    harness.registered()({ type: "drop-ads:import-settings", backupText: "{}" }, {}, (value) => { response = value; });
    await tick();
    assert.equal(response.error, expected);
  }
});

test("M448 throwing response channel is contained by asynchronous failure delivery", async () => {
  const harness = makeApi();
  const guarded = createImportGuardedApi(harness.api, { preflight: () => { throw new Error("nope"); } });
  guarded.runtime.onMessage.addListener(() => false);
  assert.equal(harness.registered()({ type: "drop-ads:import-settings", backupText: "{}" }, {}, () => { throw new Error("closed channel"); }), true);
  await tick();
});
