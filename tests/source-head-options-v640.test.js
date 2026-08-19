import test from "node:test";
import assert from "node:assert/strict";
import { MAX_SOURCE_HEAD_TIMEOUT_MS, snapshotHeadDiagnosticOptions } from "../tools/source-qualification-input.mjs";

test("HEAD options are snapshotted with defaults", () => {
  const safe = snapshotHeadDiagnosticOptions(undefined, 5_000);
  assert.equal(safe.timeoutMs, 5_000);
  assert.equal(typeof safe.setTimeoutImpl, "function");
  assert.equal(typeof safe.clearTimeoutImpl, "function");
  assert.equal(typeof safe.AbortControllerImpl, "function");
  assert.equal(Object.isFrozen(safe), true);
});

test("HEAD options reject unsafe descriptors and timeout values", () => {
  const getter = {};
  Object.defineProperty(getter, "timeoutMs", { enumerable: true, get() { throw new Error("getter ran"); } });
  assert.throws(() => snapshotHeadDiagnosticOptions(getter), /data property/);
  assert.throws(() => snapshotHeadDiagnosticOptions(Object.create({ timeoutMs: 1 })), /plain object/);
  assert.throws(() => snapshotHeadDiagnosticOptions({ timeoutMs: MAX_SOURCE_HEAD_TIMEOUT_MS + 1 }), /timeout/);
  assert.throws(() => snapshotHeadDiagnosticOptions({ setTimeoutImpl: 1 }), /collaborators/);
  assert.throws(() => snapshotHeadDiagnosticOptions({ unexpected: true }), /fields/);
});
