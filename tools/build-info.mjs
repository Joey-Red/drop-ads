import { createHash } from "node:crypto";
import { lstat, open } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import {
  MAX_BUILD_INPUT_DESCRIPTORS,
  MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES,
  snapshotBuildFingerprintInputs
} from "./build-input-descriptor-safety.mjs";
import {
  assertCanonicalBuildInputPath,
  discoverBuildInputFiles,
  compareBuildInputText,
  discoverBuildInputRoots
} from "./build-input-discovery.mjs";
import {
  snapshotBuildInputDirectoryAncestry,
  revalidateBuildInputDirectoryAncestry
} from "./build-input-ancestry.mjs";
import { snapshotReleasePackageIdentity } from "./release-package-identity.mjs";

export const BUILD_INFO_SCHEMA_VERSION = 1;
export const BUILD_INPUT_ROOTS = Object.freeze(["src", "lists", "manifests"]);
export const BUILD_INPUT_FILES = Object.freeze([
  ".gitattributes",
  "package.json",
  "package-lock.json",
  "tools/build.mjs",
  "tools/build-info.mjs",
  "tools/build-input-ancestry.mjs",
  "tools/build-input-descriptor-safety.mjs",
  "tools/build-input-discovery.mjs",
  "tools/release-package-identity.mjs",
  "tools/source-tree-audit.mjs"
]);
export const BUILD_PACKAGE_MAX_BYTES = 256 * 1024;
export const BUILD_INFO_MAX_BYTES = 8 * 1024 * 1024;
export const MAX_BUILD_INPUT_FILE_BYTES = MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES;
export const MAX_SOURCE_HASH_INPUT_BYTES = MAX_BUILD_INPUT_FILE_BYTES;
export const MAX_BUILD_INPUT_AGGREGATE_BYTES = 256 * 1024 * 1024;
export const MAX_BUILD_FINGERPRINT_CANONICAL_BYTES = BUILD_INFO_MAX_BYTES;

const MAX_BUILD_INPUT_ROOT_MEMBERS = 32;
const MAX_BUILD_INPUT_FIXED_MEMBERS = 256;
const HASH_CHUNK_BYTES = 64 * 1024;
const BUILD_INFO_KEYS = new Set(["schemaVersion", "package", "sourceFingerprint", "inputs"]);
const PACKAGE_KEYS = new Set(["name", "version"]);
const FINGERPRINT_TEXT = /^sha256:[0-9a-f]{64}$/;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

function validateBuildInputMembershipContract() {
  if (!Object.isFrozen(BUILD_INPUT_ROOTS) || !Object.isFrozen(BUILD_INPUT_FILES)) throw new TypeError("Build input membership must be immutable");
  if (BUILD_INPUT_ROOTS.length <= 0 || BUILD_INPUT_ROOTS.length > MAX_BUILD_INPUT_ROOT_MEMBERS) throw new RangeError("Build input root membership count is invalid");
  if (BUILD_INPUT_FILES.length <= 0 || BUILD_INPUT_FILES.length > MAX_BUILD_INPUT_FIXED_MEMBERS) throw new RangeError("Build input fixed membership count is invalid");

  const roots = new Set();
  for (const root of BUILD_INPUT_ROOTS) {
    assertCanonicalBuildInputPath(root);
    if (root.includes("/")) throw new TypeError(`Build input recursive root must be a single path segment: ${root}`);
    if (roots.has(root)) throw new TypeError(`Duplicate build input recursive root: ${root}`);
    roots.add(root);
  }

  const files = new Set();
  for (const file of BUILD_INPUT_FILES) {
    assertCanonicalBuildInputPath(file);
    if (files.has(file)) throw new TypeError(`Duplicate fixed build input file: ${file}`);
    if (BUILD_INPUT_ROOTS.some((root) => file.startsWith(`${root}/`))) {
      throw new TypeError(`Fixed build input overlaps recursive root: ${file}`);
    }
    files.add(file);
  }
  return true;
}

validateBuildInputMembershipContract();

function repoPath(root, path) {
  return assertCanonicalBuildInputPath(relative(root, path).split(sep).join("/"));
}

async function requireRegularFile(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new TypeError(`Build input file is unsafe: ${path}`);
  return stat;
}

function sameIdentity(before, opened) {
  if (before.size !== opened.size) return false;
  if (Number.isSafeInteger(before.dev) && Number.isSafeInteger(opened.dev) && before.dev !== opened.dev) return false;
  if (Number.isSafeInteger(before.ino) && Number.isSafeInteger(opened.ino) && before.ino !== opened.ino) return false;
  return true;
}

function sameSnapshot(left, right) {
  return left.size === right.size && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

async function requireBuildRepositoryRoot(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError("Build repository root must be a real directory");
  return stat;
}

function assertStableBuildRepositoryRoot(before, after, phase) {
  if (!sameIdentity(before, after) || !sameSnapshot(before, after)) {
    throw new Error(`Build repository root identity changed during ${phase}`);
  }
}

export async function hashBuildInputFile(path) {
  const before = await requireRegularFile(path);
  if (before.size > MAX_BUILD_INPUT_FILE_BYTES) throw new RangeError(`Build input exceeds the ${MAX_BUILD_INPUT_FILE_BYTES}-byte hash ceiling: ${path}`);
  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || !sameIdentity(before, opened)) throw new Error(`Build input changed before hashing: ${path}`);
    if (opened.size > MAX_BUILD_INPUT_FILE_BYTES) throw new RangeError(`Build input exceeds the ${MAX_BUILD_INPUT_FILE_BYTES}-byte hash ceiling: ${path}`);

    const hash = createHash("sha256");
    let bytes = 0;
    while (true) {
      const remaining = MAX_BUILD_INPUT_FILE_BYTES + 1 - bytes;
      const buffer = Buffer.allocUnsafe(Math.min(HASH_CHUNK_BYTES, remaining));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      bytes += bytesRead;
      if (bytes > MAX_BUILD_INPUT_FILE_BYTES) throw new RangeError(`Build input grew beyond its hash byte ceiling: ${path}`);
      if (bytes > opened.size) throw new Error(`Build input grew while hashing: ${path}`);
      hash.update(buffer.subarray(0, bytesRead));
    }
    if (bytes !== opened.size) throw new Error(`Build input size changed while hashing: ${path}`);

    const after = await handle.stat();
    if (!after.isFile() || !sameSnapshot(opened, after)) throw new Error(`Build input changed while hashing: ${path}`);
    const pathnameAfter = await requireRegularFile(path);
    if (!sameIdentity(before, pathnameAfter) || !sameSnapshot(before, pathnameAfter)) throw new Error(`Build input pathname identity changed while hashing: ${path}`);
    return Object.freeze({ bytes, sha256: hash.digest("hex") });
  } finally {
    await handle.close();
  }
}

async function readBoundedBuildUtf8File(path, maxBytes, label) {
  const before = await requireRegularFile(path);
  if (before.size <= 0 || before.size > maxBytes) throw new RangeError(`${label} byte size is invalid`);
  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || !sameIdentity(before, opened) || opened.size <= 0 || opened.size > maxBytes) throw new Error(`${label} changed before reading`);
    const chunks = [];
    let bytes = 0;
    while (true) {
      const buffer = Buffer.allocUnsafe(Math.min(HASH_CHUNK_BYTES, maxBytes + 1 - bytes));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      bytes += bytesRead;
      if (bytes > maxBytes || bytes > opened.size) throw new RangeError(`${label} exceeds its byte ceiling`);
      chunks.push(buffer.subarray(0, bytesRead));
    }
    if (bytes !== opened.size) throw new Error(`${label} changed while reading`);
    const after = await handle.stat();
    if (!after.isFile() || !sameSnapshot(opened, after)) throw new Error(`${label} changed while reading`);
    const pathnameAfter = await requireRegularFile(path);
    if (!sameIdentity(before, pathnameAfter) || !sameSnapshot(before, pathnameAfter)) throw new Error(`${label} pathname identity changed while reading`);
    try {
      return UTF8_DECODER.decode(Buffer.concat(chunks, bytes));
    } catch {
      throw new TypeError(`${label} must be strict UTF-8`);
    }
  } finally {
    await handle.close();
  }
}

export async function collectBuildInputs(rootDirectory) {
  const root = resolve(rootDirectory);
  const absolutePaths = await discoverBuildInputRoots(root, BUILD_INPUT_ROOTS.map((directory) => resolve(root, directory)));
  for (const file of BUILD_INPUT_FILES) absolutePaths.push(resolve(root, file));
  if (absolutePaths.length > MAX_BUILD_INPUT_DESCRIPTORS) throw new RangeError("Build input descriptor count exceeds its pre-hash ceiling");

  const canonicalByPath = new Map();
  const seenCanonicalPaths = new Set();
  for (const path of absolutePaths) {
    const canonicalPath = repoPath(root, path);
    if (seenCanonicalPaths.has(canonicalPath)) throw new TypeError(`Duplicate build input path before hashing: ${canonicalPath}`);
    seenCanonicalPaths.add(canonicalPath);
    canonicalByPath.set(path, canonicalPath);
  }
  absolutePaths.sort((a, b) => compareBuildInputText(canonicalByPath.get(a), canonicalByPath.get(b)));

  const inputs = [];
  let aggregateBytes = 0;
  for (const path of absolutePaths) {
    const canonicalPath = repoPath(root, path);
    const ancestry = await snapshotBuildInputDirectoryAncestry(root, path);
    const descriptor = await hashBuildInputFile(path);
    await revalidateBuildInputDirectoryAncestry(ancestry);
    aggregateBytes += descriptor.bytes;
    if (aggregateBytes > MAX_BUILD_INPUT_AGGREGATE_BYTES) throw new RangeError(`Build input aggregate exceeds the ${MAX_BUILD_INPUT_AGGREGATE_BYTES}-byte ceiling`);
    inputs.push({ path: canonicalPath, bytes: descriptor.bytes, sha256: descriptor.sha256 });
  }
  return inputs;
}

function exactDataObject(value, allowedKeys, label) {
  let isArray;
  let prototype;
  let keys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (!value || typeof value !== "object" || isArray || (prototype !== Object.prototype && prototype !== null)) throw new TypeError(`${label} must be a plain data object`);
  if (keys.length !== allowedKeys.size || keys.some((key) => typeof key !== "string" || !allowedKeys.has(key))) throw new TypeError(`${label} fields are invalid`);
  const values = Object.create(null);
  for (const key of allowedKeys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}.${key} must be an enumerable data field`);
    values[key] = descriptor.value;
  }
  return values;
}

export { snapshotBuildFingerprintInputs } from "./build-input-descriptor-safety.mjs";

export function fingerprintBuildInputs(inputs) {
  const canonical = [...snapshotBuildFingerprintInputs(inputs)];
  canonical.sort((a, b) => compareBuildInputText(a.path, b.path));
  const hash = createHash("sha256");
  let canonicalBytes = 0;
  function updateCanonical(text) {
    const bytes = Buffer.byteLength(text, "utf8");
    canonicalBytes += bytes;
    if (canonicalBytes > MAX_BUILD_FINGERPRINT_CANONICAL_BYTES) {
      throw new RangeError("Build input canonical fingerprint data exceeds its UTF-8 byte ceiling");
    }
    hash.update(text, "utf8");
  }
  updateCanonical("[");
  for (let index = 0; index < canonical.length; index += 1) {
    if (index > 0) updateCanonical(",");
    updateCanonical(JSON.stringify(canonical[index]));
  }
  updateCanonical("]");
  return hash.digest("hex");
}

export function validateBuildInfo(info) {
  const root = exactDataObject(info, BUILD_INFO_KEYS, "build info");
  if (root.schemaVersion !== BUILD_INFO_SCHEMA_VERSION) throw new TypeError("build info schemaVersion is invalid");
  const packageValue = exactDataObject(root.package, PACKAGE_KEYS, "build info.package");
  const packageIdentity = snapshotReleasePackageIdentity(packageValue.name, packageValue.version, "build info.package");
  if (typeof root.sourceFingerprint !== "string" || !FINGERPRINT_TEXT.test(root.sourceFingerprint)) throw new TypeError("build info sourceFingerprint is invalid");
  const inputs = snapshotBuildFingerprintInputs(root.inputs);
  const expectedFingerprint = `sha256:${fingerprintBuildInputs(inputs)}`;
  if (root.sourceFingerprint !== expectedFingerprint) throw new TypeError("build info sourceFingerprint does not match build inputs");
  return Object.freeze({ schemaVersion: BUILD_INFO_SCHEMA_VERSION, package: packageIdentity, sourceFingerprint: expectedFingerprint, inputs });
}

export async function createBuildInfo(rootDirectory) {
  const root = resolve(rootDirectory);
  const rootBefore = await requireBuildRepositoryRoot(root);
  const packageText = await readBoundedBuildUtf8File(resolve(root, "package.json"), BUILD_PACKAGE_MAX_BYTES, "package.json");
  const rootAfterPackage = await requireBuildRepositoryRoot(root);
  assertStableBuildRepositoryRoot(rootBefore, rootAfterPackage, "package metadata read");
  let packageJson;
  try { packageJson = JSON.parse(packageText); }
  catch { throw new TypeError("package.json must contain valid JSON"); }
  const inputs = await collectBuildInputs(root);
  const rootAfterInputs = await requireBuildRepositoryRoot(root);
  assertStableBuildRepositoryRoot(rootBefore, rootAfterInputs, "build input collection");
  const info = {
    schemaVersion: BUILD_INFO_SCHEMA_VERSION,
    package: { name: packageJson.name, version: packageJson.version },
    sourceFingerprint: `sha256:${fingerprintBuildInputs(inputs)}`,
    inputs
  };
  return validateBuildInfo(info);
}

export function serializeBuildInfo(info) {
  const safe = validateBuildInfo(info);
  const serialized = `${JSON.stringify(safe, null, 2)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > BUILD_INFO_MAX_BYTES) throw new RangeError("build info exceeds its byte ceiling");
  return serialized;
}
