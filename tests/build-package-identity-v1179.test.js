import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fingerprintBuildInputs, validateBuildInfo } from "../tools/build-info.mjs";

const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");
const sha256 = "0".repeat(64);
const inputs = [{ path: "src/example.js", bytes: 1, sha256 }];

function info(name, version) {
  return {
    schemaVersion: 1,
    package: { name, version },
    sourceFingerprint: `sha256:${fingerprintBuildInputs(inputs)}`,
    inputs
  };
}

test("M1179 accepts release-safe package identity through build-info validation", () => {
  const safe = validateBuildInfo(info("drop-ads", "0.1.0"));
  assert.deepEqual(safe.package, { name: "drop-ads", version: "0.1.0" });
});

test("M1179 rejects package identity outside the shared release grammar", () => {
  assert.throws(() => validateBuildInfo(info("drop ads", "0.1.0")), /build info\.package\.name is invalid/);
  assert.match(buildInfo, /snapshotReleasePackageIdentity\(packageValue\.name, packageValue\.version, "build info\.package"\)/);
  assert.match(buildInfo, /"tools\/release-package-identity\.mjs"/);
  assert.doesNotMatch(buildInfo, /function safePackageText/);
});
