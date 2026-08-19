import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// This audit verifies the current archive/release implementation directly.
// Historical tests are intentionally not part of this inventory: the normal
// test gate owns current regression coverage, while this integration audit
// owns release-source composition and contract markers.
const REQUIREMENTS = Object.freeze([
  ["tools/release-tool-contract.mjs", ["RELEASE_TOOL_PATHS", "tools/atomic-output-temp.mjs", "tools/package-source-io.mjs", "tools/release-archive-contract.mjs", "tools/release-package-identity.mjs", "tools/verify-reproducible.mjs", "tools/zip-verify.mjs"]],
  ["tools/release-tool-contract-audit.mjs", ["release tool must be a regular non-symlink file", "release manifest is not bound to canonical release tool provenance", "tools/release-archive-contract.mjs", "tools/release-package-identity.mjs"]],
  ["tools/atomic-output-temp.mjs", ["randomBytes(16)", "snapshotAtomicOutputParent", "Atomic output parent changed before publish", "assertAtomicOutputPublished", "Atomic output published byte size is invalid"]],
  ["tools/release-output-io.mjs", ["writeReleaseOutputTextAtomic", "snapshotAtomicOutputParent", "assertAtomicOutputParentUnchanged", "assertAtomicOutputPublished", "open(temp, \"wx\", 0o600)", "await handle.sync()"]],
  ["tools/package-output-io.mjs", ["writePackageBinaryAtomic", "snapshotAtomicOutputParent", "assertAtomicOutputParentUnchanged", "assertAtomicOutputPublished", "open(temp, \"wx\", 0o600)"]],
  ["tools/release-manifest-io.mjs", ["writeReleaseOutputTextAtomic", "RELEASE_MANIFEST_MAX_BYTES", "dirname(outputPath)", "basename(outputPath)"]],
  ["tools/package.mjs", ["auditReleaseToolContract(root)", "snapshotReleasePackageIdentity", "invalidateReleaseOutputs", "Packaging failed and release outputs could not be invalidated", "makeStoredZip", "createReleaseManifest", "verifyRelease(root)"]],
  ["tools/release-archive-contract.mjs", ["maxEntries: 1_024", "maxArchiveBytes: 64 * 1024 * 1024", "maxEntryBytes: 16 * 1024 * 1024", "maxPathBytes: 512", "maxTotalUncompressedBytes: 64 * 1024 * 1024", "maxSourceDirectories: 4_096", "maxSourcePathBytes: 1_024"]],
  ["tools/deterministic-zip.mjs", ["RELEASE_ARCHIVE_LIMITS", "readRegularFileBounded", "ZIP archive exceeds release byte ceiling before final allocation", "opendir(current)", "ZIP source directory count exceeds supported limit", "ZIP source discovery count exceeds supported limit", "central.writeUInt16LE(20, 4)", "central.writeUInt32LE(0, 38)"]],
  ["tools/zip-verify.mjs", ["RELEASE_ARCHIVE_LIMITS", "ZIP_VERIFY_LIMITS", "ZIP archive exceeds verification byte ceiling before allocation", "unexpected version fields", "non-canonical disk/attribute fields", "central entry order is non-canonical", "readRegularFileBounded"]],
  ["tools/package-source-io.mjs", ["must be a regular non-symlink file", "exceeds its byte ceiling before allocation", "changed during bounded read"]],
  ["tools/release-package-identity.mjs", ["RELEASE_PACKAGE_NAME_MAX_LENGTH = 128", "RELEASE_PACKAGE_VERSION_MAX_LENGTH = 64", "snapshotReleasePackageIdentity"]],
  ["tools/release-manifest.mjs", ["PACKAGING_TOOL_PATHS = RELEASE_TOOL_PATHS", "RELEASE_TOOL_MAX_BYTES = 2 * 1024 * 1024", "RELEASE_ARTIFACT_MAX_BYTES = 64 * 1024 * 1024", "expectedArtifactRequestPath", "snapshotReleasePackageIdentity", "release manifest packagingTools set is invalid"]],
  ["tools/verify-release.mjs", ["auditReleaseToolContract(root)", "snapshotReleasePackageIdentity", "verifyStoredZipAgainstDirectory", "release-manifest.json", "validateReleaseManifest", "createReleaseManifest"]],
  ["tools/verify-reproducible.mjs", ["REPRODUCIBILITY_LIMITS", "maxFiles: 4_096", "maxTotalBytes: 256 * 1024 * 1024", "validateDistTopLevel", "reproducibilityChildEnv", "NODE_OPTIONS", "NODE_PATH"]]
]);

export async function auditArchiveReleaseIntegration(rootDirectory) {
  const root = resolve(rootDirectory);
  for (const [path, markers] of REQUIREMENTS) {
    const text = await readFile(resolve(root, path), "utf8");
    for (const marker of markers) {
      if (!text.includes(marker)) throw new Error(`archive release integration missing ${marker} in ${path}`);
    }
  }
  return Object.freeze({ files: Object.freeze(REQUIREMENTS.map(([path]) => path)) });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const root = resolve(import.meta.dirname, "..");
  const result = await auditArchiveReleaseIntegration(root);
  console.log(`canonical M1112-M1118 archive release boundaries are joined (${result.files.length} source files)`);
  console.log("extended through M1128 release verification and reproducibility boundaries");
  console.log("extended through M1139 atomic output and archive writer boundaries");
}
