import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { auditBuiltExtensions } from "./artifact-audit.mjs";
import {
  BUILD_INFO_MAX_BYTES,
  BUILD_PACKAGE_MAX_BYTES,
  createBuildInfo,
  validateBuildInfo
} from "./build-info.mjs";
import { verifyBuiltExtensionsContent } from "./build-output-verify.mjs";
import { readBoundedJsonFile } from "./bounded-json-file.mjs";
import { makeStoredZip } from "./deterministic-zip.mjs";
import { createReleaseManifest } from "./release-manifest.mjs";
import { writeReleaseManifestAtomic } from "./release-manifest-io.mjs";
import { snapshotReleasePackageIdentity } from "./release-package-identity.mjs";
import { auditReleaseToolContract } from "./release-tool-contract-audit.mjs";
import { verifyRelease } from "./verify-release.mjs";

const root = resolve(import.meta.dirname, "..");

await auditReleaseToolContract(root);

const packageJson = await readBoundedJsonFile(resolve(root, "package.json"), {
  maxBytes: BUILD_PACKAGE_MAX_BYTES,
  label: "package.json"
});
const packageValue = snapshotReleasePackageIdentity(packageJson?.name, packageJson?.version, "package.json");
const version = packageValue.version;

async function verifyBuildIdentity() {
  const expected = await createBuildInfo(root);
  for (const browser of ["chromium", "firefox"]) {
    const path = resolve(root, "dist", browser, "build-info.json");
    const actualJson = await readBoundedJsonFile(path, {
      maxBytes: BUILD_INFO_MAX_BYTES,
      label: `${browser} build-info.json`
    });
    const actual = validateBuildInfo(actualJson);
    assert.deepEqual(actual, expected, `${browser} build identity is stale or does not match current source inputs`);
  }
  return expected;
}

const buildInfo = await verifyBuildIdentity();
await auditBuiltExtensions(root);
await verifyBuiltExtensionsContent(root);

const chromiumArtifact = `dist/${packageValue.name}-${version}-chromium.zip`;
const firefoxArtifact = `dist/${packageValue.name}-${version}-firefox.xpi`;
const releaseOutputPaths = Object.freeze([
  resolve(root, chromiumArtifact),
  resolve(root, firefoxArtifact),
  resolve(root, "dist", "release-manifest.json")
]);

async function invalidateReleaseOutputs() {
  for (const path of releaseOutputPaths) await rm(path, { force: true });
}

await invalidateReleaseOutputs();

let verified;
try {
  await makeStoredZip(resolve(root, "dist", "chromium"), resolve(root, chromiumArtifact));
  await makeStoredZip(resolve(root, "dist", "firefox"), resolve(root, firefoxArtifact));

  const releaseManifest = await createReleaseManifest({
    rootDirectory: root,
    packageName: packageValue.name,
    version,
    sourceFingerprint: buildInfo.sourceFingerprint,
    artifacts: [
      { browser: "chromium", path: chromiumArtifact },
      { browser: "firefox", path: firefoxArtifact }
    ]
  });
  await writeReleaseManifestAtomic(resolve(root, "dist", "release-manifest.json"), releaseManifest);
  verified = await verifyRelease(root);
} catch (error) {
  try {
    await invalidateReleaseOutputs();
  } catch (cleanupError) {
    throw new AggregateError([error, cleanupError], "Packaging failed and release outputs could not be invalidated");
  }
  throw error;
}

console.log(`Packaged and verified ${packageValue.name} ${version} for Chromium and Firefox (${verified.sourceFingerprint})`);
for (const artifact of verified.artifacts) console.log(`${artifact.browser}: ${artifact.file} sha256:${artifact.sha256}`);
