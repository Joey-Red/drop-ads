import test from "node:test";
import assert from "node:assert/strict";
import { snapshotReleaseManifestRequest } from "../tools/release-manifest.mjs";

const valid = () => ({
  rootDirectory: "/tmp/drop-ads",
  packageName: "drop-ads",
  version: "0.1.0",
  sourceFingerprint: `sha256:${"a".repeat(64)}`,
  artifacts: [
    { browser: "chromium", path: "dist/drop-ads-0.1.0-chromium.zip" },
    { browser: "firefox", path: "dist/drop-ads-0.1.0-firefox.xpi" }
  ]
});

test("snapshotReleaseManifestRequest accepts exactly one Chromium and Firefox artifact", () => {
  const result = snapshotReleaseManifestRequest(valid());
  assert.deepEqual(result.artifacts.map((item) => item.browser), ["chromium", "firefox"]);
});

test("snapshotReleaseManifestRequest rejects duplicate browsers", () => {
  const request = valid();
  request.artifacts[1] = { browser: "chromium", path: "dist/other.zip" };
  assert.throws(() => snapshotReleaseManifestRequest(request), /duplicate chromium/);
});

test("snapshotReleaseManifestRequest rejects accessor-backed fields without invoking them", () => {
  let reads = 0;
  const request = valid();
  Object.defineProperty(request.artifacts[0], "path", {
    enumerable: true,
    get() {
      reads += 1;
      return "dist/hidden.zip";
    }
  });
  assert.throws(() => snapshotReleaseManifestRequest(request), /data field/);
  assert.equal(reads, 0);
});

test("snapshotReleaseManifestRequest rejects sparse artifact arrays and extra request fields", () => {
  const sparse = valid();
  sparse.artifacts = new Array(2);
  sparse.artifacts[0] = { browser: "chromium", path: "dist/a.zip" };
  assert.throws(() => snapshotReleaseManifestRequest(sparse), /dense|holes/);
  const extra = valid();
  extra.telemetry = true;
  assert.throws(() => snapshotReleaseManifestRequest(extra), /fields are invalid/);
});
