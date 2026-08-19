import test from "node:test";
import assert from "node:assert/strict";
import { fingerprintBuildInputs, snapshotBuildFingerprintInputs } from "../tools/build-info.mjs";

const A = { path: "src/a.js", bytes: 1, sha256: "a".repeat(64) };
const B = { path: "src/b.js", bytes: 2, sha256: "b".repeat(64) };

test("fingerprintBuildInputs is order-independent after safe snapshotting", () => {
  assert.equal(fingerprintBuildInputs([A, B]), fingerprintBuildInputs([B, A]));
});

test("snapshotBuildFingerprintInputs rejects duplicate paths", () => {
  assert.throws(() => snapshotBuildFingerprintInputs([A, { ...A }]), /Duplicate build input path/);
});

test("snapshotBuildFingerprintInputs rejects accessor-backed descriptor fields without invoking them", () => {
  let reads = 0;
  const hostile = { bytes: 1, sha256: "a".repeat(64) };
  Object.defineProperty(hostile, "path", {
    enumerable: true,
    get() {
      reads += 1;
      return "src/a.js";
    }
  });
  assert.throws(() => snapshotBuildFingerprintInputs([hostile]), /data field/);
  assert.equal(reads, 0);
});

test("snapshotBuildFingerprintInputs rejects holes and path traversal", () => {
  const sparse = new Array(2);
  sparse[0] = A;
  assert.throws(() => snapshotBuildFingerprintInputs(sparse), /dense|holes/);
  assert.throws(() => snapshotBuildFingerprintInputs([{ path: "../escape", bytes: 1, sha256: "a".repeat(64) }]), /path is invalid/);
});
