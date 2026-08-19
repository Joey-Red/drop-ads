import test from "node:test";
import assert from "node:assert/strict";
import { PACKAGING_TOOL_PATHS, serializeReleaseManifest, validateReleaseManifest } from "../tools/release-manifest.mjs";

function validManifest() {
  return {
    schemaVersion: 1,
    package: { name: "drop-ads", version: "0.1.0" },
    sourceFingerprint: `sha256:${"a".repeat(64)}`,
    packagingTools: PACKAGING_TOOL_PATHS.map((path, index) => ({ path, bytes: index + 1, sha256: String(index + 1).repeat(64).slice(0, 64) })),
    artifacts: [
      { browser: "chromium", file: "drop-ads-0.1.0-chromium.zip", bytes: 10, sha256: "c".repeat(64) },
      { browser: "firefox", file: "drop-ads-0.1.0-firefox.xpi", bytes: 11, sha256: "f".repeat(64) }
    ]
  };
}

test("validateReleaseManifest accepts and canonicalizes valid manifest data", () => {
  const result = validateReleaseManifest(validManifest());
  assert.deepEqual(result.artifacts.map((item) => item.browser), ["chromium", "firefox"]);
  assert.equal(result.packagingTools.length, PACKAGING_TOOL_PATHS.length);
});

test("validateReleaseManifest rejects accessor-backed fields without invoking them", () => {
  let reads = 0;
  const manifest = validManifest();
  Object.defineProperty(manifest.artifacts[0], "sha256", {
    enumerable: true,
    get() {
      reads += 1;
      return "c".repeat(64);
    }
  });
  assert.throws(() => validateReleaseManifest(manifest), /data field/);
  assert.equal(reads, 0);
});

test("validateReleaseManifest rejects malformed artifact identity and extra fields", () => {
  const wrongFile = validManifest();
  wrongFile.artifacts[0].file = "other.zip";
  assert.throws(() => validateReleaseManifest(wrongFile), /file is invalid/);

  const extra = validManifest();
  extra.telemetry = true;
  assert.throws(() => validateReleaseManifest(extra), /fields are invalid/);
});

test("serializeReleaseManifest serializes only validated normalized data", () => {
  const text = serializeReleaseManifest(validManifest());
  assert.match(text, /"schemaVersion": 1/);
  assert.ok(text.endsWith("\n"));
});
