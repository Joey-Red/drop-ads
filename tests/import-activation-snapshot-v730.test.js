import test from "node:test";
import assert from "node:assert/strict";
import { pendingImportRemoteActivations } from "../src/core/import-guard.js";

function subscription(id) {
  return Object.freeze({
    id,
    title: id,
    format: "hosts",
    sourceUrl: `https://lists.example.com/${id}.txt`,
    enabled: true,
    builtIn: false
  });
}

test("pending import activations are immutable canonical snapshots", () => {
  const pending = pendingImportRemoteActivations(
    { subscriptions: [subscription("external-pending")] },
    { subscriptions: [] },
    {}
  );
  assert.equal(Object.isFrozen(pending), true);
  assert.equal(Object.isFrozen(pending[0]), true);
  assert.throws(() => pending.push(subscription("external-other")), TypeError);
});
