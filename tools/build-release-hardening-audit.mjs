import fs from "node:fs";
import { auditBuildInputHardening } from "./build-input-hardening-audit.mjs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} regressed`);
}

const buildInfo = read("tools/build-info.mjs");
const buildInputDiscovery = read("tools/build-input-discovery.mjs");
const buildInputDescriptorSafety = read("tools/build-input-descriptor-safety.mjs");
const buildInputAncestry = read("tools/build-input-ancestry.mjs");
const buildTool = read("tools/build.mjs");
const releaseManifest = read("tools/release-manifest.mjs");
const releaseManifestIo = read("tools/release-manifest-io.mjs");
const releaseOutputIo = read("tools/release-output-io.mjs");
const packageTool = read("tools/package.mjs");

requireText(buildInputDiscovery, "Build input entry is a symbolic link", "build-tree symlink rejection");
for (const [needle, label] of [
  ["export async function hashBuildInputFile(path)", "streamed build-input hashing"],
  ["Build input changed while hashing", "build-input mutation rejection"],
  ["export { snapshotBuildFingerprintInputs }", "descriptor-safe fingerprint snapshot export"],
  ["Duplicate build input path", "duplicate fingerprint path rejection"],
  ["BUILD_PACKAGE_MAX_BYTES = 256 * 1024", "bounded package metadata"],
  ["BUILD_INFO_MAX_BYTES = 8 * 1024 * 1024", "bounded build-info output"],
  ["MAX_BUILD_FINGERPRINT_CANONICAL_BYTES = BUILD_INFO_MAX_BYTES", "bounded canonical fingerprint serialization"],
  ["new TextDecoder(\"utf-8\", { fatal: true })", "strict UTF-8 package metadata"],
  ["export function validateBuildInfo(info)", "build-info schema validation"],
  ["sourceFingerprint does not match build inputs", "build-info fingerprint consistency"],
  ["discoverBuildInputRoots", "shared-root build-input discovery"],
  ["snapshotBuildInputDirectoryAncestry", "build-input ancestry snapshot"],
  ["revalidateBuildInputDirectoryAncestry", "build-input ancestry revalidation"],
  ["snapshotReleasePackageIdentity", "shared release package identity"]
]) requireText(buildInfo, needle, label);
requireText(buildInputDescriptorSafety, "export function snapshotBuildFingerprintInputs(inputs)", "descriptor-safe fingerprint snapshot implementation");
requireText(buildInputDescriptorSafety, "MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES = 256 * 1024 * 1024", "descriptor aggregate byte ceiling");
requireText(buildInputAncestry, "MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES = 64", "build-input ancestry ceiling");
requireText(buildInputAncestry, "export async function revalidateBuildInputDirectoryAncestry", "build-input ancestry revalidation implementation");
reject(buildInfo, /\breadFile\s*\(/, "build-info whole-file source read");
reject(buildInfo, /localeCompare/, "locale-sensitive build-input ordering");
reject(buildInfo, /Buffer\.from\(JSON\.stringify\(canonical\)/, "whole canonical fingerprint buffer allocation");

for (const [needle, label] of [
  ["Build source hash changed after fingerprinting", "generated source hash binding"],
  ["readFingerprintBoundManifest", "manifest provenance binding"],
  ["MAX_BUILD_BROWSER_SOURCE_BYTES = 64 * 1024 * 1024", "per-browser source budget"],
  ["assertGeneratedSourceMembership", "generated source membership preflight"],
  ["finalSerializedBuildInfo !== serializedBuildInfo", "final source re-fingerprint gate"],
  ["BUILD_OUTPUT_TEXT_MAX_BYTES", "generated text byte ceiling"]
]) requireText(buildTool, needle, label);
if ((buildTool.match(/await auditSourceTree\(root\);/g) || []).length !== 2) throw new Error("final source-tree build re-audit is missing");
if ((buildTool.match(/await auditGeneratedExtensionContract\(root\);/g) || []).length !== 2) throw new Error("final generated-contract build re-audit is missing");

for (const [needle, label] of [
  ["RELEASE_MANIFEST_MAX_BYTES = 256 * 1024", "bounded release-manifest output"],
  ["release artifact path must stay under dist/", "release artifact path containment"],
  ["must be a regular non-symlink file", "release file symlink rejection"],
  ["export async function describeReleaseFile(path", "streamed release file hashing"],
  ["changed while hashing", "release file mutation rejection"],
  ["export function snapshotReleaseManifestRequest(request)", "descriptor-safe release request snapshot"],
  ["release manifest requires Chromium and Firefox artifacts", "paired browser artifact request"],
  ["export function validateReleaseManifest(manifest)", "release manifest schema validation"],
  ["release manifest browser artifact set is invalid", "release browser artifact set enforcement"]
]) requireText(releaseManifest, needle, label);
reject(releaseManifest, /\breadFile\s*\(/, "release-manifest whole-file hash read");

for (const [needle, label] of [
  ["export async function writeReleaseManifestAtomic", "atomic release-manifest writer"],
  ["writeReleaseOutputTextAtomic", "shared atomic release-output delegation"],
  ["serializeReleaseManifest", "canonical release-manifest serialization"],
  ["RELEASE_MANIFEST_MAX_BYTES", "release-manifest byte ceiling enforcement"],
  ["dirname(outputPath)", "release-manifest stage-directory derivation"],
  ["basename(outputPath)", "release-manifest stage-relative output name"]
]) requireText(releaseManifestIo, needle, label);

for (const [needle, label] of [
  ["export async function writeReleaseOutputTextAtomic", "shared atomic release-output writer"],
  ['open(temp, "wx", 0o600)', "exclusive private release-output temporary file"],
  ["await handle.sync()", "release-output temporary fsync"],
  ["assertAtomicOutputParentUnchanged", "release-output parent identity revalidation"],
  ["rename(temp, output)", "atomic release-output rename"],
  ["assertAtomicOutputPublished", "release-output publication verification"],
  ["rm(temp, { force: true })", "release-output failed-temporary cleanup"],
  ["requireRealDirectory(stage, \"Release staging directory\")", "release-output staging-directory symlink rejection"]
]) requireText(releaseOutputIo, needle, label);

requireText(packageTool, "writeReleaseManifestAtomic", "package atomic release-manifest persistence");
reject(packageTool, /\bwriteFile\s*\(/, "package direct release-manifest write");

auditBuildInputHardening();

console.log("build-release-hardening-audit: build fingerprint and release manifest boundaries verified");
console.log("build-release-hardening-audit: extended through M1169 build input fingerprint boundaries");
console.log("build-release-hardening-audit: extended through M1179 deterministic build input boundaries");
console.log("build-release-hardening-audit: extended through M1189 repository-root and ancestry boundaries");
console.log("build-release-hardening-audit: extended through M1199 generated-source provenance boundaries verified");
