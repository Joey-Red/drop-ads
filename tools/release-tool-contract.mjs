export const RELEASE_TOOL_PATHS = Object.freeze([
  "tools/archive-release-integration-audit.mjs",
  "tools/artifact-audit.mjs",
  "tools/atomic-output-temp.mjs",
  "tools/bounded-json-file.mjs",
  "tools/build-info.mjs",
  "tools/build-output-verify.mjs",
  "tools/deterministic-zip.mjs",
  "tools/package-output-io.mjs",
  "tools/package-source-io.mjs",
  "tools/package.mjs",
  "tools/release-archive-contract.mjs",
  "tools/release-manifest-io.mjs",
  "tools/release-manifest.mjs",
  "tools/release-output-io.mjs",
  "tools/release-package-identity.mjs",
  "tools/release-tool-contract-audit.mjs",
  "tools/release-tool-contract.mjs",
  "tools/verify-release.mjs",
  "tools/verify-reproducible.mjs",
  "tools/zip-verify.mjs"
]);

export function releaseToolPaths() {
  return Object.freeze([...RELEASE_TOOL_PATHS]);
}
