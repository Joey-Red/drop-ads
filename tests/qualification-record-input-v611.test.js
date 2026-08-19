import assert from "node:assert/strict";
import test from "node:test";
import { createQualificationRecord } from "../tools/qualification-record.mjs";

const fingerprint = `sha256:${"a".repeat(64)}`;
const input = {
  gitHead: "b".repeat(40),
  gitStatus: "",
  currentBuildInfo: { package: { name: "drop-ads", version: "0.1.0" }, sourceFingerprint: fingerprint, inputs: [] },
  chromiumBuildInfo: { package: { name: "drop-ads", version: "0.1.0" }, sourceFingerprint: fingerprint, inputs: [] },
  firefoxBuildInfo: { package: { name: "drop-ads", version: "0.1.0" }, sourceFingerprint: fingerprint, inputs: [] },
  releaseManifest: {
    package: { name: "drop-ads", version: "0.1.0" },
    sourceFingerprint: fingerprint,
    artifacts: [
      { browser: "chromium", file: "drop-ads-0.1.0-chromium.zip", bytes: 1, sha256: "c".repeat(64) },
      { browser: "firefox", file: "drop-ads-0.1.0-firefox.xpi", bytes: 1, sha256: "d".repeat(64) }
    ]
  },
  nodeVersion: "22.0.0",
  npmUserAgent: "npm/10.0.0 node/v22.0.0"
};

test("qualification record constructor accepts plain snapshotted inputs", () => {
  const record = createQualificationRecord(input);
  assert.equal(record.schemaVersion, 4);
  assert.equal(record.package.name, "drop-ads");
  assert.equal(record.artifacts.chromium.file, "drop-ads-0.1.0-chromium.zip");
});

test("qualification record constructor rejects accessor-backed outer fields without executing them", () => {
  let getterCalls = 0;
  const hostile = { ...input };
  Object.defineProperty(hostile, "gitHead", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "b".repeat(40);
    }
  });
  assert.throws(() => createQualificationRecord(hostile), /data field/);
  assert.equal(getterCalls, 0);
});

test("qualification record constructor rejects extra outer fields", () => {
  assert.throws(() => createQualificationRecord({ ...input, telemetry: false }), /fields are invalid/);
});
