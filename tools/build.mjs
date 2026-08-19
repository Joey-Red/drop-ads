import { createHash } from "node:crypto";
import { lstat, mkdir, rm } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { createBuildInfo, serializeBuildInfo } from "./build-info.mjs";
import {
  snapshotBuildInputDirectoryAncestry,
  revalidateBuildInputDirectoryAncestry
} from "./build-input-ancestry.mjs";
import {
  BUILD_OUTPUT_BINARY_MAX_BYTES,
  BUILD_OUTPUT_TEXT_MAX_BYTES,
  BUILD_OUTPUT_MAX_DIRECTORY_DEPTH,
  BUILD_OUTPUT_PATH_MAX_BYTES,
  writeBuildOutputBinaryAtomic,
  writeBuildOutputTextAtomic
} from "./build-output-io.mjs";
import { verifyBuiltExtensionsContent } from "./build-output-verify.mjs";
import { auditSourceTree } from "./source-tree-audit.mjs";
import { generatedExtensionFilesForBrowser } from "./generated-extension-contract.mjs";
import { auditGeneratedExtensionContract } from "./generated-extension-contract-audit.mjs";
import { readRegularFileBounded } from "./package-source-io.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const browsers = ["chromium", "firefox"];
const GENERATED_FILES = new Set(["manifest.json", "build-info.json"]);
const MANIFEST_SOURCE_MAX_BYTES = 256 * 1024;
const MAX_BUILD_BROWSER_SOURCE_BYTES = 64 * 1024 * 1024;
const STRICT_UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

async function requireRealDirectory(path, label) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError(`${label} must be a real directory`);
}

function canonicalBuildDirectory(relativeDirectory) {
  if (typeof relativeDirectory !== "string" || !relativeDirectory || isAbsolute(relativeDirectory) || relativeDirectory.includes("\\") || relativeDirectory.includes("\0")) {
    throw new TypeError("Build directory must be a repository-relative path");
  }
  if (Buffer.byteLength(relativeDirectory, "utf8") > BUILD_OUTPUT_PATH_MAX_BYTES) {
    throw new RangeError("Build directory path exceeds its UTF-8 byte ceiling");
  }
  const parts = relativeDirectory.split("/");
  if (parts[0] !== "dist" || parts.some((part) => !part || part === "." || part === "..")) {
    throw new TypeError("Build directory must be canonical under dist/");
  }
  if (parts.length > BUILD_OUTPUT_MAX_DIRECTORY_DEPTH) throw new RangeError("Build directory exceeds its depth ceiling");
  const absolute = resolve(root, relativeDirectory);
  const child = relative(root, absolute);
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child) || child.split(sep).join("/") !== relativeDirectory) {
    throw new TypeError("Build directory escapes the repository");
  }
  return Object.freeze({ absolute, parts });
}

async function ensureBuildDirectory(relativeDirectory) {
  const { absolute, parts } = canonicalBuildDirectory(relativeDirectory);
  await requireRealDirectory(root, "Build repository root");
  let current = root;
  for (const part of parts) {
    current = resolve(current, part);
    try {
      await requireRealDirectory(current, "Build directory component");
      continue;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    try {
      await mkdir(current, { mode: 0o700 });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
    await requireRealDirectory(current, "Build directory component");
  }
  if (absolute !== current) throw new Error("Build directory creation resolved unexpectedly");
  return absolute;
}

function assertGeneratedTextWithinBuildLimit(text, label) {
  if (typeof text !== "string") throw new TypeError(`${label} must be text`);
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= 0 || bytes > BUILD_OUTPUT_TEXT_MAX_BYTES) throw new RangeError(`${label} exceeds the generated text byte ceiling`);
  return bytes;
}

function buildInputDescriptorMap(buildInfo) {
  const map = new Map();
  for (const descriptor of buildInfo.inputs) {
    if (map.has(descriptor.path)) throw new TypeError(`Duplicate build-info input descriptor: ${descriptor.path}`);
    map.set(descriptor.path, descriptor);
  }
  return map;
}

function contractSourceFingerprintPath(relativePath) {
  if (GENERATED_FILES.has(relativePath)) return null;
  return relativePath.startsWith("lists/") ? relativePath : `src/${relativePath}`;
}

function assertGeneratedSourceMembership(descriptorMap) {
  const required = new Set(browsers.map((browser) => `manifests/${browser}.json`));
  for (const browser of browsers) {
    for (const relativePath of generatedExtensionFilesForBrowser(browser)) {
      const fingerprintPath = contractSourceFingerprintPath(relativePath);
      if (fingerprintPath) required.add(fingerprintPath);
    }
  }
  for (const fingerprintPath of required) {
    if (!descriptorMap.has(fingerprintPath)) {
      throw new TypeError(`Generated source is missing from build-info inputs: ${fingerprintPath}`);
    }
  }
  return Object.freeze([...required]);
}

function addBrowserSourceBytes(budget, bytes, browser) {
  if (!budget || !Number.isSafeInteger(budget.bytes) || budget.bytes < 0) throw new TypeError("Build browser source budget is invalid");
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError("Build browser source byte count is invalid");
  const next = budget.bytes + bytes;
  if (!Number.isSafeInteger(next) || next > MAX_BUILD_BROWSER_SOURCE_BYTES) {
    throw new RangeError(`${browser} build source bytes exceed the ${MAX_BUILD_BROWSER_SOURCE_BYTES}-byte ceiling`);
  }
  budget.bytes = next;
}

function assertSourceBytesMatchBuildInfo(descriptorMap, fingerprintPath, data) {
  const expected = descriptorMap.get(fingerprintPath);
  if (!expected) throw new TypeError(`Build source is missing from build-info inputs: ${fingerprintPath}`);
  if (data.length !== expected.bytes) throw new Error(`Build source byte length changed after fingerprinting: ${fingerprintPath}`);
  const actualHash = createHash("sha256").update(data).digest("hex");
  if (actualHash !== expected.sha256) throw new Error(`Build source hash changed after fingerprinting: ${fingerprintPath}`);
}

async function readFingerprintBoundSource(fingerprintPath, descriptorMap, { maxBytes, label }) {
  const source = resolve(root, fingerprintPath);
  const ancestry = await snapshotBuildInputDirectoryAncestry(root, source);
  const data = await readRegularFileBounded(source, { maxBytes, label, allowEmpty: false });
  await revalidateBuildInputDirectoryAncestry(ancestry);
  assertSourceBytesMatchBuildInfo(descriptorMap, fingerprintPath, data);
  return data;
}

async function readFingerprintBoundManifest(browser, descriptorMap) {
  const fingerprintPath = `manifests/${browser}.json`;
  const data = await readFingerprintBoundSource(fingerprintPath, descriptorMap, {
    maxBytes: MANIFEST_SOURCE_MAX_BYTES,
    label: `${browser} manifest source`
  });
  let text;
  try {
    text = STRICT_UTF8_DECODER.decode(data);
  } catch {
    throw new TypeError(`${browser} manifest source must be strict UTF-8`);
  }
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    throw new TypeError(`${browser} manifest source must contain valid JSON`);
  }
  return Object.freeze({ manifest, sourceBytes: data.byteLength });
}

// These live inside the build tool rather than only in npm wrappers so direct
// build/reproducibility/package paths cannot bypass filesystem or contract drift.
await auditSourceTree(root);
await auditGeneratedExtensionContract(root);

await rm(dist, { recursive: true, force: true });

try {
  const buildInfo = await createBuildInfo(root);
  const buildInputDescriptors = buildInputDescriptorMap(buildInfo);
  assertGeneratedSourceMembership(buildInputDescriptors);
  const serializedBuildInfo = serializeBuildInfo(buildInfo);
  assertGeneratedTextWithinBuildLimit(serializedBuildInfo, "generated build-info.json");

  async function copyContractFile(browser, relativePath, sourceBudget) {
    const fingerprintPath = contractSourceFingerprintPath(relativePath);
    if (!fingerprintPath) return;
    const destinationRelative = `dist/${browser}/${relativePath}`;
    const slash = destinationRelative.lastIndexOf("/");
    if (slash <= 0) throw new TypeError("Build contract destination has no parent directory");
    await ensureBuildDirectory(destinationRelative.slice(0, slash));
    const data = await readFingerprintBoundSource(fingerprintPath, buildInputDescriptors, {
      maxBytes: BUILD_OUTPUT_BINARY_MAX_BYTES,
      label: `build contract source ${relativePath}`
    });
    addBrowserSourceBytes(sourceBudget, data.byteLength, browser);
    await writeBuildOutputBinaryAtomic(root, destinationRelative, data);
  }

  for (const browser of browsers) {
    const sourceBudget = { bytes: 0 };
    await ensureBuildDirectory(`dist/${browser}`);
    for (const relativePath of generatedExtensionFilesForBrowser(browser)) {
      await copyContractFile(browser, relativePath, sourceBudget);
    }
    const { manifest, sourceBytes } = await readFingerprintBoundManifest(browser, buildInputDescriptors);
    addBrowserSourceBytes(sourceBudget, sourceBytes, browser);
    const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
    assertGeneratedTextWithinBuildLimit(manifestText, `${browser} generated manifest.json`);
    await writeBuildOutputTextAtomic(root, `dist/${browser}/manifest.json`, manifestText);
    await writeBuildOutputTextAtomic(root, `dist/${browser}/build-info.json`, serializedBuildInfo);
  }

  const finalBuildInfo = await createBuildInfo(root);
  const finalSerializedBuildInfo = serializeBuildInfo(finalBuildInfo);
  if (finalSerializedBuildInfo !== serializedBuildInfo) {
    throw new Error("Build source state changed during generated output creation");
  }
  await auditSourceTree(root);
  await auditGeneratedExtensionContract(root);
  const verified = await verifyBuiltExtensionsContent(root);
  if (verified.sourceFingerprint !== buildInfo.sourceFingerprint) {
    throw new Error("Verified generated output source fingerprint differs from the direct build fingerprint");
  }

  console.log(`Built contract-locked unpacked extensions in dist/chromium and dist/firefox (${buildInfo.sourceFingerprint})`);
} catch (error) {
  try {
    await rm(dist, { recursive: true, force: true });
  } catch (cleanupError) {
    throw new AggregateError([error, cleanupError], "Build failed and partial generated output could not be invalidated");
  }
  throw error;
}
