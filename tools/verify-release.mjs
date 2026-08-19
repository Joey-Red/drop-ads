import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { auditBuiltExtensions } from "./artifact-audit.mjs";
import {
  BUILD_INFO_MAX_BYTES,
  BUILD_PACKAGE_MAX_BYTES,
  createBuildInfo,
  validateBuildInfo
} from "./build-info.mjs";
import { verifyBuiltExtensionsContent } from "./build-output-verify.mjs";
import { readBoundedJsonFile } from "./bounded-json-file.mjs";
import {
  RELEASE_MANIFEST_MAX_BYTES,
  createReleaseManifest,
  validateReleaseManifest
} from "./release-manifest.mjs";
import { snapshotReleasePackageIdentity } from "./release-package-identity.mjs";
import { auditReleaseToolContract } from "./release-tool-contract-audit.mjs";
import { verifyStoredZipAgainstDirectory } from "./zip-verify.mjs";

export async function verifyRelease(rootDirectory) {
  const root = resolve(rootDirectory);
  await auditReleaseToolContract(root);

  const packageJson = await readBoundedJsonFile(resolve(root, "package.json"), {
    maxBytes: BUILD_PACKAGE_MAX_BYTES,
    label: "package.json"
  });
  const packageValue = snapshotReleasePackageIdentity(packageJson?.name, packageJson?.version, "package.json");
  const version = packageValue.version;
  const expectedBuildInfo = await createBuildInfo(root);

  const buildInfoByBrowser = {};
  for (const browser of ["chromium", "firefox"]) {
    const actualJson = await readBoundedJsonFile(resolve(root, "dist", browser, "build-info.json"), {
      maxBytes: BUILD_INFO_MAX_BYTES,
      label: `${browser} build-info.json`
    });
    const actual = validateBuildInfo(actualJson);
    assert.deepEqual(actual, expectedBuildInfo, `${browser} build-info.json does not match current source inputs`);
    buildInfoByBrowser[browser] = actual;
  }
  assert.deepEqual(buildInfoByBrowser.chromium, buildInfoByBrowser.firefox, "Firefox/Chromium build identity mismatch");

  await auditBuiltExtensions(root);
  const generatedContent = await verifyBuiltExtensionsContent(root);
  assert.equal(generatedContent.sourceFingerprint, expectedBuildInfo.sourceFingerprint, "generated browser bytes are not bound to current source fingerprint");

  const chromiumArtifact = `dist/${packageValue.name}-${version}-chromium.zip`;
  const firefoxArtifact = `dist/${packageValue.name}-${version}-firefox.xpi`;
  const recordedManifestJson = await readBoundedJsonFile(resolve(root, "dist", "release-manifest.json"), {
    maxBytes: RELEASE_MANIFEST_MAX_BYTES,
    label: "release-manifest.json"
  });
  const recordedManifest = validateReleaseManifest(recordedManifestJson);
  const expectedManifest = await createReleaseManifest({
    rootDirectory: root,
    packageName: packageValue.name,
    version,
    sourceFingerprint: expectedBuildInfo.sourceFingerprint,
    artifacts: [
      { browser: "chromium", path: chromiumArtifact },
      { browser: "firefox", path: firefoxArtifact }
    ]
  });
  assert.deepEqual(recordedManifest, expectedManifest, "release-manifest.json does not match current source/tool/artifact bytes");

  const chromiumPayload = await verifyStoredZipAgainstDirectory(
    resolve(root, chromiumArtifact),
    resolve(root, "dist", "chromium")
  );
  const firefoxPayload = await verifyStoredZipAgainstDirectory(
    resolve(root, firefoxArtifact),
    resolve(root, "dist", "firefox")
  );

  return {
    package: expectedManifest.package,
    sourceFingerprint: expectedBuildInfo.sourceFingerprint,
    artifacts: expectedManifest.artifacts,
    generatedFiles: {
      chromium: generatedContent.chromium.files.length,
      firefox: generatedContent.firefox.files.length
    },
    payloadEntries: {
      chromium: chromiumPayload.entries,
      firefox: firefoxPayload.entries
    }
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  verifyRelease(root)
    .then((result) => {
      console.log(`Release verification passed (${result.sourceFingerprint})`);
      for (const artifact of result.artifacts) console.log(`${artifact.browser}: ${artifact.file} sha256:${artifact.sha256}`);
      console.log(`generated files: chromium=${result.generatedFiles.chromium}, firefox=${result.generatedFiles.firefox}`);
      console.log(`payload entries: chromium=${result.payloadEntries.chromium}, firefox=${result.payloadEntries.firefox}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
