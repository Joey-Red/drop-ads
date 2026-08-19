import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";
import { MAX_SETTINGS_BACKUP_BYTES } from "../src/core/settings-backup.js";

function installCoreGuard() {
  let wrapped = null;
  const api = {
    runtime: {
      onMessage: {
        addListener(listener) { wrapped = listener; },
        removeListener() {}
      }
    }
  };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  guarded.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
    sendResponse({ ok: true });
    return true;
  });
  return (backupText) => {
    let response = null;
    const handled = wrapped(
      { type: "drop-ads:import-settings", backupText },
      {},
      (value) => { response = value; }
    );
    return { handled, response };
  };
}

test("M396 exact-bound ASCII backup messages remain admitted", () => {
  const send = installCoreGuard();
  assert.deepEqual(send("a".repeat(MAX_SETTINGS_BACKUP_BYTES)), {
    handled: true,
    response: { ok: true }
  });
});

test("M396 one-over character input rejects before successful listener delivery", () => {
  const send = installCoreGuard();
  const result = send("a".repeat(MAX_SETTINGS_BACKUP_BYTES + 1));
  assert.equal(result.handled, true);
  assert.equal(result.response.ok, false);
  assert.match(result.response.error, /backupText exceeds/);
});

test("M396 UTF-8 byte ceiling remains authoritative after character preflight", () => {
  const send = installCoreGuard();
  const result = send("é".repeat(Math.floor(MAX_SETTINGS_BACKUP_BYTES / 2) + 1));
  assert.equal(result.handled, true);
  assert.equal(result.response.ok, false);
  assert.match(result.response.error, /UTF-8 bytes/);
});
