import { createHash } from "node:crypto";
import { lstat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { auditGeneratedTree } from "./artifact-audit.mjs";
import {
  snapshotBuildInputDirectoryAncestry,
  revalidateBuildInputDirectoryAncestry
} from "./build-input-ancestry.mjs";
import { BUILD_OUTPUT_BINARY_MAX_BYTES } from "./build-output-io.mjs";
import { generatedExtensionFilesForBrowser } from "./generated-extension-contract.mjs";
import {
  beginGeneratedVerificationPass,
  finishGeneratedVerificationPass
} from "./generated-verification-pass.mjs";
import {
  createBuildInfo,
  serializeBuildInfo,
  snapshotBuildFingerprintInputs
} from "./build-info.mjs";
import { readRegularFileBounded } from "./package-source-io.mjs";

export const GENERATED_VERIFY_AGGREGATE_MAX_BYTES = 64 * 1024 * 1024;
export const GENERATED_VERIFY_PATH_MAX_BYTES = 1024;
const MANIFEST_SOURCE_MAX_BYTES = 256 * 1024;
const MAX_VERIFICATION_CONTRACT_FILES = 4096;
const STRICT_UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const GENERATED_TRANSFORM_FILES = new Set(["manifest.json", "build-info.json"]);
const VERIFICATION_BROWSERS = Object.freeze(["chromium", "firefox"]);
const VERIFICATION_PATH_CONTROL_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;
const SOURCE_FINGERPRINT_PATTERN = /^sha256:[0-9a-f]{64}$/;
const STRING_IS_WELL_FORMED = String.prototype.isWellFormed;
const STRING_NORMALIZE = String.prototype.normalize;

function assertVerificationBrowser(browser) {
  if (typeof browser !== "string" || !VERIFICATION_BROWSERS.includes(browser)) {
    throw new TypeError(`Unsupported generated verification target: ${String(browser)}`);
  }
  return browser;
}

function assertVerificationSourceFingerprint(value, label) {
  if (typeof value !== "string" || !SOURCE_FINGERPRINT_PATTERN.test(value)) {
    throw new TypeError(`${label} must be canonical sha256:-prefixed lowercase SHA-256 text`);
  }
  return value;
}

function assertCanonicalVerificationRelativePath(value, label) {
  if (typeof value !== "string" || !value) throw new TypeError(`${label} must be a canonical repository-relative path`);
  if (typeof STRING_IS_WELL_FORMED !== "function" || !STRING_IS_WELL_FORMED.call(value)) {
    throw new TypeError(`${label} must be well-formed Unicode`);
  }
  if (STRING_NORMALIZE.call(value, "NFC") !== value) throw new TypeError(`${label} must use NFC Unicode`);
  if (VERIFICATION_PATH_CONTROL_TEXT.test(value)) throw new TypeError(`${label} contains forbidden control text`);
  if (isAbsolute(value) || value.startsWith("/") || value.includes("\\") || value.includes("\0")) {
    throw new TypeError(`${label} must be a canonical repository-relative path`);
  }
  if (Buffer.byteLength(value, "utf8") > GENERATED_VERIFY_PATH_MAX_BYTES) {
    throw new RangeError(`${label} exceeds the ${GENERATED_VERIFY_PATH_MAX_BYTES}-byte UTF-8 path ceiling`);
  }
  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new TypeError(`${label} must not contain empty, dot, or dot-dot segments`);
  }
  return value;
}

function resolveVerificationChild(root, relativePath, label) {
  const canonical = assertCanonicalVerificationRelativePath(relativePath, label);
  const absolute = resolve(root, canonical);
  const back = relative(root, absolute);
  if (!back || isAbsolute(back) || back === ".." || back.startsWith(`..${sep}`) || back.split(sep).join("/") !== canonical) {
    throw new TypeError(`${label} escapes its verification root`);
  }
  return absolute;
}

function snapshotVerificationContractSource(source, browser) {
  if (!Array.isArray(source)) throw new TypeError(`${browser} generated verification contract must be an array`);
  const keys = Reflect.ownKeys(source);
  if (keys.length === 0 || keys.length > MAX_VERIFICATION_CONTRACT_FILES + 1) {
    throw new RangeError(`${browser} generated verification contract descriptor ceiling exceeded`);
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(source, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value <= 0 || lengthDescriptor.value > MAX_VERIFICATION_CONTRACT_FILES) {
    throw new RangeError(`${browser} generated verification contract member count is invalid`);
  }
  const length = lengthDescriptor.value;
  if (keys.length !== length + 1) throw new TypeError(`${browser} generated verification contract must be dense and field-exact`);
  const values = new Array(length);
  const keySet = new Set(keys);
  if (!keySet.has("length")) throw new TypeError(`${browser} generated verification contract length field is missing`);
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keySet.has(key)) throw new TypeError(`${browser} generated verification contract must not contain holes`);
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") {
      throw new TypeError(`${browser} generated verification contract entries must be string data fields`);
    }
    values[index] = descriptor.value;
  }
  for (const key of keys) {
    if (key === "length") continue;
    if (typeof key !== "string" || !/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= length || String(Number(key)) !== key) {
      throw new TypeError(`${browser} generated verification contract contains unsupported own key`);
    }
  }
  return Object.freeze(values);
}

function snapshotVerificationContract(browser) {
  const target = assertVerificationBrowser(browser);
  const source = snapshotVerificationContractSource(generatedExtensionFilesForBrowser(target), target);
  const seen = new Set();
  const files = [];
  for (let index = 0; index < source.length; index += 1) {
    const path = assertCanonicalVerificationRelativePath(source[index], `${target} generated verification contract path ${index}`);
    if (seen.has(path)) throw new TypeError(`${target} generated verification contract contains duplicate path: ${path}`);
    seen.add(path);
    files.push(path);
  }
  const sorted = [...files].sort();
  if (files.some((path, index) => path !== sorted[index])) {
    throw new TypeError(`${target} generated verification contract must be sorted deterministically`);
  }
  return Object.freeze(files);
}

const VERIFICATION_CONTRACTS = Object.freeze({
  chromium: snapshotVerificationContract("chromium"),
  firefox: snapshotVerificationContract("firefox")
});

function verificationFilesForBrowser(browser) {
  return VERIFICATION_CONTRACTS[assertVerificationBrowser(browser)];
}

export function snapshotGeneratedVerificationContract(browser) {
  return verificationFilesForBrowser(browser);
}

async function resolveVerificationRoot(rootDirectory) {
  if (typeof rootDirectory !== "string" || rootDirectory.length === 0) {
    throw new TypeError("Generated verification root must be a non-empty path string");
  }
  const root = resolve(rootDirectory);
  const stat = await lstat(root);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new TypeError("Generated verification root must be a real non-symlink directory");
  }
  return root;
}

function normalizedManifest(manifest) {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function admitAggregate(totalBytes, bytes, label) {
  if (!Buffer.isBuffer(bytes)) throw new TypeError(`${label} must be a Buffer`);
  const next = totalBytes + bytes.length;
  if (!Number.isSafeInteger(next) || next > GENERATED_VERIFY_AGGREGATE_MAX_BYTES) {
    throw new RangeError(`${label} aggregate generated verification byte ceiling exceeded`);
  }
  return next;
}

function freezeVerificationBrowserResult(browser, sourceFingerprint, files) {
  const target = assertVerificationBrowser(browser);
  const fingerprint = assertVerificationSourceFingerprint(sourceFingerprint, `${target} verification source fingerprint`);
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_VERIFICATION_CONTRACT_FILES) {
    throw new TypeError(`${target} verification result files must be a bounded array`);
  }
  const frozenFiles = Object.freeze(files.map((path, index) => assertCanonicalVerificationRelativePath(path, `${target} verification result path ${index}`)));
  return Object.freeze({ browser: target, sourceFingerprint: fingerprint, files: frozenFiles });
}

function freezeVerificationPairResult(chromium, firefox, sourceFingerprint) {
  if (!Object.isFrozen(chromium) || chromium.browser !== "chromium") throw new TypeError("Chromium verification result must be frozen and canonical");
  if (!Object.isFrozen(firefox) || firefox.browser !== "firefox") throw new TypeError("Firefox verification result must be frozen and canonical");
  const fingerprint = assertVerificationSourceFingerprint(sourceFingerprint, "Shared verification source fingerprint");
  if (chromium.sourceFingerprint !== fingerprint || firefox.sourceFingerprint !== fingerprint) {
    throw new Error("Browser verification results do not match the shared source fingerprint");
  }
  return Object.freeze({ chromium, firefox, sourceFingerprint: fingerprint });
}

function buildInputDescriptorMap(buildInfo) {
  const inputs = snapshotBuildFingerprintInputs(buildInfo.inputs);
  const map = new Map();
  for (const descriptor of inputs) {
    if (map.has(descriptor.path)) throw new TypeError(`Duplicate build-info input descriptor: ${descriptor.path}`);
    map.set(descriptor.path, descriptor);
  }
  return map;
}

function generatedSourceFingerprintPath(path) {
  const generatedPath = assertCanonicalVerificationRelativePath(path, "Generated verification member path");
  return generatedPath.startsWith("lists/") ? generatedPath : `src/${generatedPath}`;
}

function assertVerificationSourceMembership(browser, descriptorMap) {
  assertVerificationBrowser(browser);
  const required = new Set([`manifests/${browser}.json`]);
  for (const path of verificationFilesForBrowser(browser)) {
    if (GENERATED_TRANSFORM_FILES.has(path)) continue;
    required.add(generatedSourceFingerprintPath(path));
  }
  for (const fingerprintPath of required) {
    assertCanonicalVerificationRelativePath(fingerprintPath, "Generated verification fingerprint path");
    if (!descriptorMap.has(fingerprintPath)) {
      throw new TypeError(`Generated verification source is missing from build-info inputs: ${fingerprintPath}`);
    }
  }
  return Object.freeze([...required]);
}

function assertExpectedSourceMatchesBuildInfo(descriptorMap, fingerprintPath, data) {
  const expected = descriptorMap.get(fingerprintPath);
  if (!expected) throw new TypeError(`Generated verification source is missing from build-info inputs: ${fingerprintPath}`);
  if (data.length !== expected.bytes) throw new Error(`Generated verification source byte length changed after fingerprinting: ${fingerprintPath}`);
  const actualHash = createHash("sha256").update(data).digest("hex");
  if (actualHash !== expected.sha256) throw new Error(`Generated verification source hash changed after fingerprinting: ${fingerprintPath}`);
}

async function readExpectedFingerprintBoundSource(root, fingerprintPath, descriptorMap, { maxBytes, label }) {
  const source = resolveVerificationChild(root, fingerprintPath, `${label} path`);
  const ancestry = await snapshotBuildInputDirectoryAncestry(root, source);
  const data = await readRegularFileBounded(source, { maxBytes, label, allowEmpty: false });
  await revalidateBuildInputDirectoryAncestry(ancestry);
  assertExpectedSourceMatchesBuildInfo(descriptorMap, fingerprintPath, data);
  return data;
}

async function readExpectedGeneratedSource(root, path, descriptorMap) {
  const fingerprintPath = generatedSourceFingerprintPath(path);
  return readExpectedFingerprintBoundSource(root, fingerprintPath, descriptorMap, {
    maxBytes: BUILD_OUTPUT_BINARY_MAX_BYTES,
    label: `generated verification source ${path}`
  });
}

async function readExpectedGeneratedManifest(root, browser, descriptorMap) {
  assertVerificationBrowser(browser);
  const fingerprintPath = `manifests/${browser}.json`;
  const data = await readExpectedFingerprintBoundSource(root, fingerprintPath, descriptorMap, {
    maxBytes: MANIFEST_SOURCE_MAX_BYTES,
    label: `${browser} generated verification source manifest`
  });
  let text;
  try {
    text = STRICT_UTF8_DECODER.decode(data);
  } catch {
    throw new TypeError(`${browser} generated verification source manifest must be strict UTF-8`);
  }
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    throw new TypeError(`${browser} generated verification source manifest must contain valid JSON`);
  }
  return normalizedManifest(manifest);
}

async function readActualGeneratedOutput(distDirectory, path, browser) {
  assertVerificationBrowser(browser);
  const output = resolveVerificationChild(distDirectory, path, `${browser} generated verification output path`);
  const ancestry = await snapshotBuildInputDirectoryAncestry(distDirectory, output);
  const data = await readRegularFileBounded(output, {
    maxBytes: BUILD_OUTPUT_BINARY_MAX_BYTES,
    label: `${browser} generated verification output ${path}`
  });
  await revalidateBuildInputDirectoryAncestry(ancestry);
  return data;
}

async function expectedGeneratedFilesFromBuildInfo(root, browser, buildInfo) {
  assertVerificationBrowser(browser);
  const contract = verificationFilesForBrowser(browser);
  if (contract.length === 0 || contract.length > MAX_VERIFICATION_CONTRACT_FILES) {
    throw new RangeError(`${browser} generated verification expected member count is invalid`);
  }
  const expected = new Map();
  const serializedBuildInfo = serializeBuildInfo(buildInfo);
  const descriptorMap = buildInputDescriptorMap(buildInfo);
  assertVerificationSourceMembership(browser, descriptorMap);
  let totalBytes = 0;
  const addExpected = (path, bytes) => {
    const canonicalPath = assertCanonicalVerificationRelativePath(path, `${browser} expected generated member path`);
    if (expected.has(canonicalPath)) throw new TypeError(`${browser} generated verification expected member is duplicated: ${canonicalPath}`);
    totalBytes = admitAggregate(totalBytes, bytes, `${browser} expected generated content`);
    expected.set(canonicalPath, bytes);
  };

  for (const path of contract) {
    if (path === "build-info.json") {
      addExpected(path, Buffer.from(serializedBuildInfo, "utf8"));
      continue;
    }
    if (path === "manifest.json") {
      addExpected(path, await readExpectedGeneratedManifest(root, browser, descriptorMap));
      continue;
    }
    addExpected(path, await readExpectedGeneratedSource(root, path, descriptorMap));
  }
  if (expected.size !== contract.length) {
    throw new Error(`${browser} generated verification expected member cardinality does not match its frozen contract`);
  }

  return { buildInfo, serializedBuildInfo, files: expected, totalBytes };
}

export async function expectedGeneratedFiles(rootDirectory, browser) {
  const root = await resolveVerificationRoot(rootDirectory);
  assertVerificationBrowser(browser);
  const buildInfo = await createBuildInfo(root);
  return expectedGeneratedFilesFromBuildInfo(root, browser, buildInfo);
}

async function verifyGeneratedBrowserContentFromBuildInfo(root, browser, buildInfo) {
  assertVerificationBrowser(browser);
  const distDirectory = resolveVerificationChild(root, `dist/${browser}`, `${browser} generated verification directory`);
  const verificationPass = await beginGeneratedVerificationPass(distDirectory);
  await auditGeneratedTree(distDirectory, browser);
  const expected = await expectedGeneratedFilesFromBuildInfo(root, browser, buildInfo);
  let actualTotalBytes = 0;

  for (const [path, expectedBytes] of expected.files) {
    const actualBytes = await readActualGeneratedOutput(distDirectory, path, browser);
    actualTotalBytes = admitAggregate(actualTotalBytes, actualBytes, `${browser} actual generated content`);
    if (!actualBytes.equals(expectedBytes)) {
      throw new Error(`${browser} generated file does not match current source/build transformation: ${path}`);
    }
  }

  const finalBuildInfo = await createBuildInfo(root);
  if (serializeBuildInfo(finalBuildInfo) !== expected.serializedBuildInfo) {
    throw new Error(`${browser} source state changed during generated verification`);
  }
  await auditGeneratedTree(distDirectory, browser);

  let finalActualTotalBytes = 0;
  for (const [path, expectedBytes] of expected.files) {
    const finalBytes = await readActualGeneratedOutput(distDirectory, path, browser);
    finalActualTotalBytes = admitAggregate(finalActualTotalBytes, finalBytes, `${browser} final generated content recheck`);
    if (!finalBytes.equals(expectedBytes)) {
      throw new Error(`${browser} generated file changed during final verification recheck: ${path}`);
    }
  }

  await finishGeneratedVerificationPass(verificationPass);
  const postPassBuildInfo = await createBuildInfo(root);
  if (serializeBuildInfo(postPassBuildInfo) !== expected.serializedBuildInfo) {
    throw new Error(`${browser} source state changed during final generated verification pass completion`);
  }

  return freezeVerificationBrowserResult(browser, expected.buildInfo.sourceFingerprint, [...expected.files.keys()].sort());
}

export async function verifyGeneratedBrowserContent(rootDirectory, browser) {
  const root = await resolveVerificationRoot(rootDirectory);
  assertVerificationBrowser(browser);
  const buildInfo = await createBuildInfo(root);
  return verifyGeneratedBrowserContentFromBuildInfo(root, browser, buildInfo);
}

export async function verifyBuiltExtensionsContent(rootDirectory) {
  const root = await resolveVerificationRoot(rootDirectory);
  const sharedBuildInfo = await createBuildInfo(root);
  const sharedSerializedBuildInfo = serializeBuildInfo(sharedBuildInfo);
  const chromium = await verifyGeneratedBrowserContentFromBuildInfo(root, "chromium", sharedBuildInfo);
  const firefox = await verifyGeneratedBrowserContentFromBuildInfo(root, "firefox", sharedBuildInfo);
  if (chromium.sourceFingerprint !== sharedBuildInfo.sourceFingerprint || firefox.sourceFingerprint !== sharedBuildInfo.sourceFingerprint) {
    throw new Error("Firefox/Chromium generated source fingerprints differ from the shared verification snapshot");
  }
  const finalBuildInfo = await createBuildInfo(root);
  if (serializeBuildInfo(finalBuildInfo) !== sharedSerializedBuildInfo) {
    throw new Error("Source state changed across Chromium/Firefox generated verification");
  }
  return freezeVerificationPairResult(chromium, firefox, sharedBuildInfo.sourceFingerprint);
}
