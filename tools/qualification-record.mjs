import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createBuildInfo } from "./build-info.mjs";
import { npmVersionFromUserAgent, parseVersion } from "./environment-audit.mjs";
import { verifyQualificationArtifactFile } from "./qualification-artifact-verify.mjs";
import {
  QUALIFICATION_RECORD_MAX_BYTES,
  readQualificationUtf8File
} from "./qualification-file-io.mjs";
import { readQualificationGitState } from "./qualification-git.mjs";
import { stringifyQualificationJsonData } from "./qualification-json-data.mjs";
import { validateQualificationRecord } from "./qualification-record-audit.mjs";
import { snapshotQualificationRecordInput } from "./qualification-record-input.mjs";
import { writeQualificationRecordAtomic } from "./qualification-record-io.mjs";

function normalizedVersion(value, label) {
  return parseVersion(value, label).join(".");
}

function requireFingerprint(value, label) {
  if (!/^sha256:[0-9a-f]{64}$/.test(value ?? "")) throw new Error(`${label} sourceFingerprint is invalid`);
  return value;
}

function requireCommit(value) {
  const commit = String(value ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{40,64}$/.test(commit)) throw new Error("Git HEAD is invalid");
  return commit;
}

function artifactDescriptor(manifest, browser) {
  const matches = Array.isArray(manifest?.artifacts) ? manifest.artifacts.filter((item) => item?.browser === browser) : [];
  if (matches.length !== 1) throw new Error(`Release manifest must contain exactly one ${browser} artifact`);
  const artifact = matches[0];
  if (typeof artifact.file !== "string" || !artifact.file || basename(artifact.file) !== artifact.file) throw new Error(`${browser} artifact filename is invalid`);
  if (!Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0) throw new Error(`${browser} artifact byte size is invalid`);
  if (!/^[0-9a-f]{64}$/.test(artifact.sha256 ?? "")) throw new Error(`${browser} artifact SHA-256 is invalid`);
  return { file: artifact.file, bytes: artifact.bytes, sha256: artifact.sha256 };
}

export function createQualificationRecord(inputValue) {
  const {
    gitHead,
    gitStatus,
    currentBuildInfo,
    chromiumBuildInfo,
    firefoxBuildInfo,
    releaseManifest,
    nodeVersion,
    npmUserAgent
  } = snapshotQualificationRecordInput(inputValue);

  if (gitStatus.trim()) throw new Error("Git worktree is dirty; qualification record requires an exact clean checkout");
  const commit = requireCommit(gitHead);
  const currentFingerprint = requireFingerprint(currentBuildInfo.sourceFingerprint, "current source");
  const chromiumFingerprint = requireFingerprint(chromiumBuildInfo.sourceFingerprint, "Chromium build");
  const firefoxFingerprint = requireFingerprint(firefoxBuildInfo.sourceFingerprint, "Firefox build");
  const releaseFingerprint = requireFingerprint(releaseManifest.sourceFingerprint, "release manifest");

  if (chromiumFingerprint !== firefoxFingerprint) throw new Error("Chromium and Firefox sourceFingerprints differ");
  if (chromiumFingerprint !== releaseFingerprint) throw new Error("Browser build and release-manifest sourceFingerprints differ");
  if (chromiumFingerprint !== currentFingerprint) throw new Error("dist is stale: packaged sourceFingerprint does not match current clean source inputs");

  const releasePackage = releaseManifest.package;
  for (const [label, info] of [["Chromium", chromiumBuildInfo], ["Firefox", firefoxBuildInfo], ["current source", currentBuildInfo]]) {
    if (info.package.name !== releasePackage.name || info.package.version !== releasePackage.version) {
      throw new Error(`${label} package identity differs from release manifest`);
    }
  }

  const chromium = artifactDescriptor(releaseManifest, "chromium");
  const firefox = artifactDescriptor(releaseManifest, "firefox");
  const npm = normalizedVersion(npmVersionFromUserAgent(npmUserAgent), "npm version");
  const node = normalizedVersion(nodeVersion, "Node version");

  return Object.freeze({
    schemaVersion: 4,
    package: Object.freeze({ name: releasePackage.name, version: releasePackage.version }),
    commit,
    sourceFingerprint: currentFingerprint,
    artifacts: Object.freeze({ chromium: Object.freeze(chromium), firefox: Object.freeze(firefox) }),
    toolchain: Object.freeze({ node, npm })
  });
}

async function verifyArtifactBytes(root, manifest) {
  for (const browser of ["chromium", "firefox"]) {
    const expected = artifactDescriptor(manifest, browser);
    await verifyQualificationArtifactFile(
      resolve(root, "dist", expected.file),
      expected,
      `${browser} package`
    );
  }
}

async function readQualificationMetadataJson(path, label) {
  const text = await readQualificationUtf8File(path, {
    maxBytes: QUALIFICATION_RECORD_MAX_BYTES,
    label
  });
  try {
    return JSON.parse(text);
  } catch {
    throw new TypeError(`${label} must contain valid JSON`);
  }
}

export async function createQualificationRecordFromCheckout(rootDirectory) {
  const root = resolve(rootDirectory);
  const [gitState, currentBuildInfo, chromiumBuildInfo, firefoxBuildInfo, releaseManifest] = await Promise.all([
    readQualificationGitState(root),
    createBuildInfo(root),
    readQualificationMetadataJson(resolve(root, "dist", "chromium", "build-info.json"), "Chromium build-info"),
    readQualificationMetadataJson(resolve(root, "dist", "firefox", "build-info.json"), "Firefox build-info"),
    readQualificationMetadataJson(resolve(root, "dist", "release-manifest.json"), "release manifest")
  ]);

  await verifyArtifactBytes(root, releaseManifest);
  return createQualificationRecord({
    gitHead: gitState.head,
    gitStatus: gitState.status,
    currentBuildInfo,
    chromiumBuildInfo,
    firefoxBuildInfo,
    releaseManifest,
    nodeVersion: process.versions.node,
    npmUserAgent: process.env.npm_config_user_agent
  });
}

export function serializeQualificationRecord(record) {
  validateQualificationRecord(record);
  const serialized = stringifyQualificationJsonData(record, "qualification record");
  if (Buffer.byteLength(serialized, "utf8") > QUALIFICATION_RECORD_MAX_BYTES) {
    throw new RangeError(`qualification record exceeds ${QUALIFICATION_RECORD_MAX_BYTES} bytes`);
  }
  return serialized;
}

export async function writeQualificationRecordFromCheckout(rootDirectory, relativeOutputPath) {
  const root = resolve(rootDirectory);
  const record = await createQualificationRecordFromCheckout(root);
  const serialized = serializeQualificationRecord(record);
  const outputPath = await writeQualificationRecordAtomic(root, relativeOutputPath, serialized);
  return { outputPath, record };
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  try {
    const outputFlagIndex = process.argv.indexOf("--output");
    if (outputFlagIndex >= 0) {
      const requestedPath = process.argv[outputFlagIndex + 1];
      if (!requestedPath || process.argv.length !== outputFlagIndex + 2) throw new Error("--output requires exactly one relative path");
      await writeQualificationRecordFromCheckout(root, requestedPath);
      console.log("qualification-record: privacy-minimal exact-head record written");
    } else {
      const record = await createQualificationRecordFromCheckout(root);
      process.stdout.write(serializeQualificationRecord(record));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
