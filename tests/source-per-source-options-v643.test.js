import test from "node:test";
import assert from "node:assert/strict";
import { snapshotPerSourceQualificationOptions } from "../tools/source-qualification-input.mjs";

test("per-source options capture only headTimeoutOptions", () => {
  const nested = { timeoutMs: 10 };
  const safe = snapshotPerSourceQualificationOptions({ headTimeoutOptions: nested });
  assert.equal(safe.headTimeoutOptions, nested);
  assert.equal(Object.isFrozen(safe), true);
});

test("per-source options reject accessors, extras, custom prototypes, and traps", () => {
  let ran = false;
  const accessor = {};
  Object.defineProperty(accessor, "headTimeoutOptions", { enumerable: true, get() { ran = true; return {}; } });
  assert.throws(() => snapshotPerSourceQualificationOptions(accessor), /data property/);
  assert.equal(ran, false);
  assert.throws(() => snapshotPerSourceQualificationOptions({ extra: true }), /fields/);
  assert.throws(() => snapshotPerSourceQualificationOptions(Object.create({})), /plain object/);
  const trapped = new Proxy({}, { ownKeys() { throw new Error("trap"); } });
  assert.throws(() => snapshotPerSourceQualificationOptions(trapped), /inspectable/);
});
