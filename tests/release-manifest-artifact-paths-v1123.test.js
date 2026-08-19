import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/release-manifest.mjs", import.meta.url), "utf8");

test("M1123 release-manifest requests are locked to exact versioned candidate paths", () => {
  assert.match(source, /function expectedArtifactRequestPath\(packageName, version, browser\)/);
  assert.match(source, /return `dist\/\$\{packageName\}-\$\{version\}-\$\{browser\}\.\$\{browser === "chromium" \? "zip" : "xpi"\}`/);
  assert.match(source, /artifact\.path !== expectedPath/);
  assert.match(source, /artifact path must be exactly/);
});

test("M1123 validates request paths before createReleaseManifest opens artifacts", () => {
  const requestIndex = source.indexOf("export function snapshotReleaseManifestRequest");
  const createIndex = source.indexOf("export async function createReleaseManifest");
  const describeIndex = source.indexOf("describeReleaseFile(artifactPath.absolute", createIndex);
  assert.ok(requestIndex >= 0 && createIndex > requestIndex && describeIndex > createIndex);
  assert.ok(source.indexOf("artifact.path !== expectedPath", requestIndex) < createIndex);
});
