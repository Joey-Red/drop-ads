import test from "node:test";
import assert from "node:assert/strict";
import {
  snapshotQualificationFileReadOptions,
  snapshotQualificationStreamReadOptions
} from "../tools/qualification-file-io.mjs";

test("M1372 file and stream read options publish exact frozen primitive snapshots", () => {
  const file = snapshotQualificationFileReadOptions({ maxBytes: 64, label: "x", allowEmpty: true, allowMissing: true });
  assert.deepEqual(file, { maxBytes: 64, label: "x", allowEmpty: true, allowMissing: true });
  assert.equal(Object.isFrozen(file), true);
  const stream = snapshotQualificationStreamReadOptions({ maxBytes: 32 });
  assert.deepEqual(stream, { maxBytes: 32, label: "qualification input", allowEmpty: false, allowMissing: false });
  assert.equal(Object.isFrozen(stream), true);
});

test("M1372 read options reject accessors, symbols, extras, and wrong primitive types", () => {
  let getterCalls = 0;
  const accessor = {};
  Object.defineProperty(accessor, "maxBytes", { enumerable: true, get() { getterCalls += 1; return 64; } });
  assert.throws(() => snapshotQualificationFileReadOptions(accessor), /own data field/);
  assert.equal(getterCalls, 0);

  const withSymbol = { maxBytes: 64 };
  withSymbol[Symbol("x")] = true;
  assert.throws(() => snapshotQualificationFileReadOptions(withSymbol), /fields are invalid/);
  assert.throws(() => snapshotQualificationFileReadOptions({ maxBytes: 64, extra: true }), /fields are invalid/);
  assert.throws(() => snapshotQualificationStreamReadOptions({ maxBytes: 64, allowMissing: true }), /fields are invalid/);
  assert.throws(() => snapshotQualificationFileReadOptions({ maxBytes: 64, allowEmpty: "yes" }), /allowEmpty must be boolean/);
  assert.throws(() => snapshotQualificationFileReadOptions({ maxBytes: 64, label: {} }), /label must be nonempty text/);
});
