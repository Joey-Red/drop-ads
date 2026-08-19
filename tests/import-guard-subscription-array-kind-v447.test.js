import test from "node:test";
import assert from "node:assert/strict";

import { pendingImportRemoteActivations } from "../src/core/import-guard.js";

function revokedProxy() {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  return proxy;
}

test("M447 revoked candidate subscription array fails through the reviewed boundary", () => {
  assert.throws(
    () => pendingImportRemoteActivations(
      { subscriptions: revokedProxy() },
      { subscriptions: [] },
      Object.create(null)
    ),
    /Candidate state\.subscriptions array kind is invalid/
  );
});

test("M447 revoked current subscription array fails deterministically", () => {
  assert.throws(
    () => pendingImportRemoteActivations(
      { subscriptions: [] },
      { subscriptions: revokedProxy() },
      Object.create(null)
    ),
    /Current state\.subscriptions array kind is invalid/
  );
});

test("M447 ordinary non-array subscription values keep compatibility fallback", () => {
  assert.deepEqual(
    pendingImportRemoteActivations(
      { subscriptions: "legacy" },
      { subscriptions: null },
      Object.create(null)
    ),
    []
  );
});
