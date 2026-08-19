import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} is forbidden`);
}

const build = read("tools/build.mjs");
const buildInfo = read("tools/build-info.mjs");
const buildOutput = read("tools/build-output-io.mjs");
const boundedJson = read("tools/bounded-json-file.mjs");
const zip = read("tools/deterministic-zip.mjs");
const packageOutput = read("tools/package-output-io.mjs");
const packageTool = read("tools/package.mjs");
const verifyRelease = read("tools/verify-release.mjs");
const reproducible = read("tools/verify-reproducible.mjs");

for (const [source, needle, label] of [
  [build, "createBuildInfo", "validated build metadata creation"],
  [buildInfo, "BUILD_PACKAGE_MAX_BYTES = 256 * 1024", "bounded package metadata read"],
  [buildInfo, "new TextDecoder(\"utf-8\", { fatal: true })", "strict UTF-8 package metadata read"],
  [build, "writeBuildOutputTextAtomic", "atomic build metadata output"]
]) requireText(source, needle, label);
reject(build, /\bwriteFile\s*\(/, "direct build metadata writeFile");

for (const [needle, label] of [
  ["open(temp, \"wx\", 0o600)", "exclusive build metadata temporary file"],
  ["rename(temp, output)", "atomic build metadata rename"],
  ["normalized.startsWith(\"dist/\")", "build output dist containment"]
]) requireText(buildOutput, needle, label);

for (const [needle, label] of [
  ["new TextDecoder(\"utf-8\", { fatal: true })", "strict UTF-8 JSON reader"],
  ["before.isSymbolicLink() || !before.isFile()", "bounded JSON regular-file guard"],
  ["total > maxBytes", "bounded JSON byte ceiling"]
]) requireText(boundedJson, needle, label);

for (const [needle, label] of [
  ["ZIP_LIMITS", "ZIP resource ceilings"],
  ["snapshotZipEntries", "descriptor-safe ZIP entry snapshot"],
  ["rootStat.isSymbolicLink() || !rootStat.isDirectory()", "ZIP source-root guard"],
  ["writePackageBinaryAtomic", "atomic ZIP package output"]
]) requireText(zip, needle, label);
reject(zip, /\bwriteFile\s*\(/, "direct ZIP package writeFile");

for (const [needle, label] of [
  ["open(temp, \"wx\", 0o600)", "exclusive package temporary file"],
  ["await handle.sync()", "package output fsync"],
  ["rename(temp, output)", "atomic package rename"]
]) requireText(packageOutput, needle, label);

for (const [source, label] of [[packageTool, "package tool"], [verifyRelease, "release verifier"]]) {
  requireText(source, "readBoundedJsonFile", `${label} bounded JSON reads`);
  requireText(source, "validateBuildInfo", `${label} build-info validation`);
  reject(source, /\breadFile\s*\(/, `${label} direct readFile metadata access`);
  reject(source, /JSON\.parse\s*\(/, `${label} direct JSON.parse metadata access`);
}
requireText(verifyRelease, "validateReleaseManifest", "release-manifest schema validation");

for (const [needle, label] of [
  ["hashReproducibilityFile", "streamed reproducibility hashing"],
  ["await open(path, \"r\")", "reproducibility opened-file hashing"],
  ["before.isSymbolicLink() || !before.isFile()", "reproducibility regular-file guard"],
  ["sameSnapshot(opened, after)", "reproducibility mutation guard"]
]) requireText(reproducible, needle, label);
reject(reproducible, /\breadFile\s*\(/, "whole-file reproducibility hashing");

console.log("package-pipeline-hardening-audit: M629-M637 build/package/reproducibility boundaries verified");
