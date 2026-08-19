import fs from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} regressed`);
}

export function auditBuildInputHardening() {
  const buildInfo = read("tools/build-info.mjs");
  const discovery = read("tools/build-input-discovery.mjs");
  const descriptorSafety = read("tools/build-input-descriptor-safety.mjs");
  const ancestry = read("tools/build-input-ancestry.mjs");
  const build = read("tools/build.mjs");

  for (const [needle, label] of [
    ["MAX_BUILD_INPUT_FILE_BYTES = MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES", "shared 16 MiB per-file hash ceiling"],
    ["MAX_SOURCE_HASH_INPUT_BYTES = MAX_BUILD_INPUT_FILE_BYTES", "source hash ceiling alias"],
    ["MAX_BUILD_INPUT_AGGREGATE_BYTES = 256 * 1024 * 1024", "256 MiB real-input aggregate ceiling"],
    ["Build input grew beyond its hash byte ceiling", "hash growth rejection"],
    ["Build input pathname identity changed while hashing", "pathname identity revalidation"],
    ["aggregateBytes > MAX_BUILD_INPUT_AGGREGATE_BYTES", "real-input aggregate admission check"],
    ["assertCanonicalBuildInputPath", "shared canonical discovery contract"],
    ["\"tools/build-input-discovery.mjs\"", "build-input discovery helper fingerprint membership"],
    ["\"tools/build-input-descriptor-safety.mjs\"", "descriptor helper fingerprint membership"],
    ["\"tools/build-input-ancestry.mjs\"", "ancestry helper fingerprint membership"],
    ["\"tools/release-package-identity.mjs\"", "release package identity fingerprint membership"],
    ["const canonicalPath = repoPath(root, path)", "fixed-input canonical admission"],
    ["discoverBuildInputRoots(root, BUILD_INPUT_ROOTS.map", "shared-root discovery"],
    ["absolutePaths.length > MAX_BUILD_INPUT_DESCRIPTORS", "pre-hash descriptor-count ceiling"],
    ["Duplicate build input path before hashing", "pre-hash duplicate refusal"],
    ["pathname identity changed while reading", "bounded package pathname revalidation"],
    ["snapshotReleasePackageIdentity(packageValue.name, packageValue.version, \"build info.package\")", "shared build/release package identity"],
    ["validateBuildInputMembershipContract();", "immutable membership contract"],
    ["Fixed build input overlaps recursive root", "membership overlap refusal"],
    ["const rootBefore = await requireBuildRepositoryRoot(root)", "build-info repository-root snapshot"],
    ["assertStableBuildRepositoryRoot(rootBefore, rootAfterPackage, \"package metadata read\")", "post-package repository-root revalidation"],
    ["assertStableBuildRepositoryRoot(rootBefore, rootAfterInputs, \"build input collection\")", "post-input repository-root revalidation"],
    ["snapshotBuildInputDirectoryAncestry(root, path)", "pre-hash ancestry snapshot"],
    ["revalidateBuildInputDirectoryAncestry(ancestry)", "post-hash ancestry revalidation"],
    ["MAX_BUILD_FINGERPRINT_CANONICAL_BYTES = BUILD_INFO_MAX_BYTES", "canonical fingerprint byte ceiling"],
    ["canonicalBytes > MAX_BUILD_FINGERPRINT_CANONICAL_BYTES", "canonical fingerprint byte admission"],
    ["JSON.stringify(canonical[index])", "incremental canonical entry serialization"]
  ]) requireText(buildInfo, needle, label);

  reject(buildInfo, /localeCompare/, "locale-sensitive build-input ordering");
  reject(buildInfo, /Buffer\.from\(JSON\.stringify\(canonical\)/, "whole canonical fingerprint buffer allocation");

  for (const [needle, label] of [
    ["MAX_BUILD_INPUT_TRAVERSAL_ENTRIES = 100_000", "traversal entry ceiling"],
    ["MAX_BUILD_INPUT_ROOT_DIRECTORIES = 4_096", "directory traversal ceiling"],
    ["MAX_BUILD_INPUT_DIRECTORY_ENTRIES = 8_192", "per-directory materialization ceiling"],
    ["MAX_BUILD_INPUT_PATH_BYTES = 1_024", "path byte ceiling"],
    ["const directory = await opendir(path)", "opened directory iteration"],
    ["async function classifyFreshEntry(path)", "fresh entry classification"],
    ["Buffer.byteLength(value, \"utf8\") > MAX_BUILD_INPUT_PATH_BYTES", "UTF-8 path bound"],
    ["value.normalize(\"NFC\") !== value", "NFC provenance path admission"],
    ["isWellFormedBuildInputText(value)", "well-formed Unicode path admission"],
    ["unsafe control text", "control-text path rejection"],
    ["posix.normalize(value) !== value", "path canonicalization check"],
    ["function sameDirectoryIdentity(left, right)", "directory identity comparison"],
    ["directory identity changed during build-input discovery", "directory mutation rejection"],
    ["export async function discoverBuildInputRoots(rootDirectory, directories)", "aggregate root discovery API"],
    ["discoverBuildInputFilesWithState(rootDirectory, directory, state)", "shared traversal state"],
    ["Reflect.ownKeys(directories)", "descriptor-safe root request key snapshot"],
    ["Object.getOwnPropertyDescriptor(directories, key)", "descriptor-safe root request value snapshot"],
    ["must be an absolute normalized path", "canonical absolute root request admission"],
    ["Duplicate build input root directory", "duplicate root request refusal"],
    ["const rootBefore = await requireDirectory(repositoryRoot)", "discovery repository-root snapshot"],
    ["sameDirectoryIdentity(rootBefore, rootAfter)", "discovery repository-root revalidation"]
  ]) requireText(discovery, needle, label);

  reject(discovery, /localeCompare/, "locale-sensitive discovery ordering");
  reject(discovery, /for \(const directory of directories\)/, "live caller root request iteration");

  for (const [needle, label] of [
    ["MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES = 16 * 1024 * 1024", "descriptor per-file byte ceiling"],
    ["MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES = 256 * 1024 * 1024", "descriptor aggregate byte ceiling"],
    ["MAX_BUILD_INPUT_DESCRIPTORS = 100_000", "descriptor count ceiling"],
    ["values.bytes > MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES", "descriptor per-file admission"],
    ["aggregateBytes > MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES", "descriptor aggregate admission"],
    ["const keySet = new Set(keys)", "linear descriptor key membership"],
    ["keySet.has(key)", "linear descriptor hole check"],
    ["Duplicate build input path", "descriptor duplicate refusal"]
  ]) requireText(descriptorSafety, needle, label);

  reject(descriptorSafety, /keys\.includes/, "quadratic descriptor key membership");

  for (const [needle, label] of [
    ["MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES = 64", "ancestry directory ceiling"],
    ["file ancestry escapes the repository root", "ancestry escape refusal"],
    ["must be a real non-symlink directory", "real ancestry directory requirement"],
    ["Object.freeze(snapshots)", "frozen ancestry snapshots"],
    ["export async function revalidateBuildInputDirectoryAncestry(snapshots)", "ancestry revalidation API"],
    ["Object.isFrozen(snapshots)", "frozen ancestry array admission"],
    ["Reflect.ownKeys(snapshots)", "ancestry own-key snapshot"],
    ["directory identity changed while hashing", "ancestry identity mutation rejection"],
    ["directory changed while hashing", "ancestry metadata mutation rejection"]
  ]) requireText(ancestry, needle, label);

  for (const [needle, label] of [
    ["function buildInputDescriptorMap(buildInfo)", "generated source descriptor map"],
    ["Build source byte length changed after fingerprinting", "generated source byte binding"],
    ["createHash(\"sha256\").update(data).digest(\"hex\")", "generated source hash binding"],
    ["readFingerprintBoundManifest(browser, descriptorMap)", "fingerprint-bound manifest transform"],
    ["MANIFEST_SOURCE_MAX_BYTES = 256 * 1024", "manifest source byte ceiling"],
    ["snapshotBuildInputDirectoryAncestry(root, source)", "generated source ancestry snapshot"],
    ["revalidateBuildInputDirectoryAncestry(ancestry)", "generated source ancestry revalidation"],
    ["const finalBuildInfo = await createBuildInfo(root)", "final source re-fingerprint"],
    ["finalSerializedBuildInfo !== serializedBuildInfo", "final source equality gate"],
    ["function assertGeneratedSourceMembership(descriptorMap)", "generated source membership preflight"],
    ["Generated source is missing from build-info inputs", "generated source membership refusal"],
    ["MAX_BUILD_BROWSER_SOURCE_BYTES = 64 * 1024 * 1024", "per-browser source byte ceiling"],
    ["addBrowserSourceBytes(sourceBudget, data.byteLength, browser)", "copied source aggregate charge"],
    ["addBrowserSourceBytes(sourceBudget, sourceBytes, browser)", "manifest source aggregate charge"],
    ["BUILD_OUTPUT_TEXT_MAX_BYTES", "shared generated text ceiling"],
    ["assertGeneratedTextWithinBuildLimit(serializedBuildInfo", "build-info pre-publication text bound"],
    ["assertGeneratedTextWithinBuildLimit(manifestText", "manifest pre-publication text bound"],
    ["await auditSourceTree(root);", "source-tree semantic audit"],
    ["await auditGeneratedExtensionContract(root);", "generated-contract semantic audit"]
  ]) requireText(build, needle, label);

  if ((build.match(/await auditSourceTree\(root\);/g) || []).length !== 2) throw new Error("final source-tree re-audit is missing");
  if ((build.match(/await auditGeneratedExtensionContract\(root\);/g) || []).length !== 2) throw new Error("final generated-contract re-audit is missing");

  // Historical milestone test files are intentionally not part of this audit.
  // Current regression coverage is owned by npm test; this audit verifies the
  // live build-input implementation and its hardening contracts directly.
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditBuildInputHardening();
  console.log("build-input-hardening-audit: canonical M1162-M1168 build input boundaries verified");
  console.log("build-input-hardening-audit: extended through M1179 deterministic build input boundaries");
  console.log("build-input-hardening-audit: extended through M1189 repository-root and ancestry boundaries verified");
  console.log("build-input-hardening-audit: extended through M1199 generated-source provenance boundaries verified");
}
