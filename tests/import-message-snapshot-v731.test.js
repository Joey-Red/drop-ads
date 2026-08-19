import test from "node:test";
import assert from "node:assert/strict";
import { createImportGuardedApi } from "../src/core/import-guard.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

test("import listener receives the frozen preflight snapshot instead of a later mutation", async () => {
  const mock = createMockWebExtension();
  let release;
  const guarded = createImportGuardedApi(mock.api, {
    preflight() { return new Promise((resolve) => { release = resolve; }); }
  });
  guarded.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    sendResponse({ ok: true, backupText: message.backupText, frozen: Object.isFrozen(message) });
    return true;
  });
  const message = { type: "drop-ads:import-settings", backupText: "original" };
  const responsePromise = mock.sendMessage(message);
  await Promise.resolve();
  message.backupText = "tampered";
  release();
  const response = await responsePromise;
  assert.deepEqual(response, { ok: true, backupText: "original", frozen: true });
});

test("import messages reject extra fields before preflight", async () => {
  const mock = createMockWebExtension();
  let preflights = 0;
  const guarded = createImportGuardedApi(mock.api, { preflight() { preflights += 1; } });
  guarded.runtime.onMessage.addListener(() => true);
  const response = await mock.sendMessage({ type: "drop-ads:import-settings", backupText: "{}", extra: true });
  assert.equal(response.ok, false);
  assert.equal(preflights, 0);
});
