import test from "node:test";
import assert from "node:assert/strict";
import { validateQualificationRecord } from "../tools/qualification-record-audit.mjs";

const HASH = "a".repeat(64);
const FINGERPRINT = `sha256:${"b".repeat(64)}`;
const COMMIT = "c".repeat(40);

function validRecord() {
  return {
    schemaVersion: 4,
    package: { name: "drop-ads", version: "0.1.0" },
    commit: COMMIT,
    sourceFingerprint: FINGERPRINT,
    artifacts: {
      chromium: { file: "drop-ads-0.1.0-chromium.zip", bytes: 1234, sha256: HASH },
      firefox: { file: "drop-ads-0.1.0-firefox.xpi", bytes: 2345, sha256: HASH }
    },
    toolchain: { node: "22.18.0", npm: "10.9.3" }
  };
}

const expectedPackage = { packageName: "drop-ads", packageVersion: "0.1.0" };

test("qualification record audit accepts exact privacy-minimal v4 record", () => {
  assert.equal(validateQualificationRecord(validRecord(), expectedPackage), true);
});

test("qualification record audit rejects host and unknown metadata", () => {
  for (const [key, value] of [
    ["qualificationHost", { platform: "linux", arch: "x64" }],
    ["timestamp", "2026-08-15T00:00:00Z"],
    ["hostname", "machine"],
    ["cwd", "/tmp/drop-ads"]
  ]) {
    const record = validRecord();
    record[key] = value;
    assert.throws(() => validateQualificationRecord(record, expectedPackage), /fields are invalid/);
  }
});

test("qualification record audit rejects malformed identity and artifacts", () => {
  const badCommit = validRecord();
  badCommit.commit = "not-a-commit";
  assert.throws(() => validateQualificationRecord(badCommit, expectedPackage), /commit is invalid/);

  const badFingerprint = validRecord();
  badFingerprint.sourceFingerprint = HASH;
  assert.throws(() => validateQualificationRecord(badFingerprint, expectedPackage), /sourceFingerprint is invalid/);

  const badHash = validRecord();
  badHash.artifacts.chromium.sha256 = "f".repeat(63);
  assert.throws(() => validateQualificationRecord(badHash, expectedPackage), /sha256 is invalid/);

  const zeroBytes = validRecord();
  zeroBytes.artifacts.firefox.bytes = 0;
  assert.throws(() => validateQualificationRecord(zeroBytes, expectedPackage), /positive safe integer/);
});

test("qualification record audit rejects malformed toolchain and package mismatch", () => {
  const badToolchain = validRecord();
  badToolchain.toolchain.node = "v22.18.0";
  assert.throws(() => validateQualificationRecord(badToolchain, expectedPackage), /toolchain.node is invalid/);

  assert.throws(
    () => validateQualificationRecord(validRecord(), { packageName: "other", packageVersion: "0.1.0" }),
    /package name does not match/
  );
});

test("qualification record audit rejects accessors and custom prototypes", () => {
  const accessorRecord = validRecord();
  Object.defineProperty(accessorRecord, "commit", { enumerable: true, get() { throw new Error("getter must not run"); } });
  assert.throws(() => validateQualificationRecord(accessorRecord, expectedPackage), /enumerable data field/);

  const customPrototype = validRecord();
  Object.setPrototypeOf(customPrototype.package, { polluted: true });
  assert.throws(() => validateQualificationRecord(customPrototype, expectedPackage), /plain object/);
});
