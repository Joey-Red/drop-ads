import { lstat, unlink } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

export const QUALIFICATION_OBSERVATION_RELATIVE_PATH = "artifacts/qualification-observation.json";
const QUALIFICATION_OBSERVATION_TEMP_SUFFIX = /^[0-9a-f]{32}$/u;
const TARGET_OPTION_KEYS = new Set(["allowMissing"]);

function assertCanonicalAbsolutePath(value, label) {
  if (typeof value !== "string" || !value || !isAbsolute(value) || resolve(value) !== value) {
    throw new TypeError(`${label} must be a canonical absolute path`);
  }
  return value;
}

function snapshotFrozenExactData(candidate, expectedKeys, label) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new TypeError(`${label} must be a frozen plain data object`);
  }
  const prototype = Object.getPrototypeOf(candidate);
  if ((prototype !== Object.prototype && prototype !== null) || !Object.isFrozen(candidate)) {
    throw new TypeError(`${label} must be a frozen plain data object`);
  }
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== expectedKeys.length || keys.some((key) => typeof key !== "string" || !expectedKeys.includes(key))) {
    throw new TypeError(`${label} has an invalid field set`);
  }
  const values = Object.create(null);
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`${label}.${key} must be an enumerable own data field`);
    }
    values[key] = descriptor.value;
  }
  return Object.freeze(values);
}

function snapshotDirectoryIdentity(identity, label) {
  const keys = ["dev", "ino", "mode", "nlink"];
  const safe = snapshotFrozenExactData(identity, keys, label);
  for (const key of keys) {
    if (typeof safe[key] !== "number" || !Number.isFinite(safe[key]) || safe[key] < 0) {
      throw new TypeError(`${label}.${key} must be a non-negative finite number`);
    }
  }
  return Object.freeze({ dev: safe.dev, ino: safe.ino, mode: safe.mode, nlink: safe.nlink });
}

function snapshotRegularFileIdentity(identity, label) {
  const keys = ["dev", "ino", "mode", "nlink", "size", "mtimeMs", "ctimeMs"];
  const safe = snapshotFrozenExactData(identity, keys, label);
  for (const key of keys) {
    if (typeof safe[key] !== "number" || !Number.isFinite(safe[key]) || safe[key] < 0) {
      throw new TypeError(`${label}.${key} must be a non-negative finite number`);
    }
  }
  return Object.freeze({
    dev: safe.dev,
    ino: safe.ino,
    mode: safe.mode,
    nlink: safe.nlink,
    size: safe.size,
    mtimeMs: safe.mtimeMs,
    ctimeMs: safe.ctimeMs
  });
}

function snapshotDirectoryState(snapshot, label) {
  const safe = snapshotFrozenExactData(snapshot, ["path", "identity"], label);
  assertCanonicalAbsolutePath(safe.path, `${label}.path`);
  return Object.freeze({ path: safe.path, identity: snapshotDirectoryIdentity(safe.identity, `${label}.identity`) });
}

function snapshotTargetState(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("qualification observation target snapshot must be a frozen plain data object");
  }
  const missingDescriptor = Object.getOwnPropertyDescriptor(snapshot, "missing");
  if (!missingDescriptor || !("value" in missingDescriptor) || "get" in missingDescriptor || "set" in missingDescriptor) {
    throw new TypeError("qualification observation target snapshot.missing must be an own data field");
  }
  const missing = missingDescriptor.value;
  if (typeof missing !== "boolean") throw new TypeError("qualification observation target snapshot.missing must be boolean");
  const keys = missing ? ["path", "missing"] : ["path", "missing", "identity"];
  const safe = snapshotFrozenExactData(snapshot, keys, "qualification observation target snapshot");
  assertCanonicalAbsolutePath(safe.path, "qualification observation target snapshot.path");
  if (missing) return Object.freeze({ path: safe.path, missing: true });
  return Object.freeze({
    path: safe.path,
    missing: false,
    identity: snapshotRegularFileIdentity(safe.identity, "qualification observation target snapshot.identity")
  });
}

export function snapshotQualificationObservationTargetOptions(options) {
  if (options === undefined) return Object.freeze({ allowMissing: false });
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("qualification observation target options must be a plain data object");
  }
  const prototype = Object.getPrototypeOf(options);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("qualification observation target options must be a plain data object");
  }
  const keys = Reflect.ownKeys(options);
  if (keys.some((key) => typeof key !== "string" || !TARGET_OPTION_KEYS.has(key))) {
    throw new TypeError("qualification observation target options contain unsupported fields");
  }
  let allowMissing = false;
  if (keys.includes("allowMissing")) {
    const descriptor = Object.getOwnPropertyDescriptor(options, "allowMissing");
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError("qualification observation target option allowMissing must be an enumerable own data field");
    }
    if (typeof descriptor.value !== "boolean") {
      throw new TypeError("qualification observation target option allowMissing must be boolean");
    }
    allowMissing = descriptor.value;
  }
  return Object.freeze({ allowMissing });
}

export function qualificationObservationOutputPath(rootDirectory) {
  const root = assertCanonicalAbsolutePath(rootDirectory, "qualification observation root");
  return resolve(root, QUALIFICATION_OBSERVATION_RELATIVE_PATH);
}

export function assertQualificationObservationOutputPath(rootDirectory, outputPath) {
  const root = assertCanonicalAbsolutePath(rootDirectory, "qualification observation root");
  const candidate = assertCanonicalAbsolutePath(outputPath, "qualification observation output path");
  const expected = qualificationObservationOutputPath(root);
  if (candidate !== expected) throw new TypeError("qualification observation output path is outside the canonical artifact target");
  const rel = relative(root, candidate);
  if (rel !== QUALIFICATION_OBSERVATION_RELATIVE_PATH) {
    throw new TypeError("qualification observation output path is not the canonical repository-relative target");
  }
  return candidate;
}

export function qualificationObservationTemporaryPath(outputPath, suffix) {
  const canonicalOutputPath = assertCanonicalAbsolutePath(outputPath, "qualification observation output path");
  if (typeof suffix !== "string" || !QUALIFICATION_OBSERVATION_TEMP_SUFFIX.test(suffix)) {
    throw new TypeError("qualification observation temporary suffix must be exactly 32 lowercase hex characters");
  }
  return join(dirname(canonicalOutputPath), `${basename(canonicalOutputPath)}.pending-${suffix}`);
}

function directoryIdentity(stat) {
  return Object.freeze({ dev: stat.dev, ino: stat.ino, mode: stat.mode, nlink: stat.nlink });
}

function regularFileIdentity(stat) {
  return Object.freeze({
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs
  });
}

function sameDirectoryIdentity(stat, identity) {
  return stat.isDirectory() && !stat.isSymbolicLink()
    && stat.dev === identity.dev && stat.ino === identity.ino
    && stat.mode === identity.mode && stat.nlink === identity.nlink;
}

function sameRegularFileIdentity(stat, identity) {
  return stat.isFile() && !stat.isSymbolicLink()
    && stat.dev === identity.dev && stat.ino === identity.ino
    && stat.mode === identity.mode && stat.nlink === identity.nlink
    && stat.size === identity.size && stat.mtimeMs === identity.mtimeMs && stat.ctimeMs === identity.ctimeMs;
}

export async function snapshotQualificationObservationRepositoryRoot(rootDirectory) {
  const root = assertCanonicalAbsolutePath(rootDirectory, "qualification observation repository root");
  const stat = await lstat(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new TypeError("qualification observation repository root must be a real directory");
  }
  return Object.freeze({ path: root, identity: directoryIdentity(stat) });
}

export async function revalidateQualificationObservationRepositoryRoot(snapshot) {
  const safe = snapshotDirectoryState(snapshot, "qualification observation repository root snapshot");
  const stat = await lstat(safe.path);
  if (!sameDirectoryIdentity(stat, safe.identity)) {
    throw new Error("qualification observation repository root changed during publication");
  }
  return true;
}

export async function snapshotQualificationObservationArtifactsDirectory(rootDirectory) {
  const outputPath = qualificationObservationOutputPath(rootDirectory);
  const artifactsDirectory = dirname(outputPath);
  const stat = await lstat(artifactsDirectory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new TypeError("qualification observation artifacts parent must be a real directory");
  }
  return Object.freeze({ path: artifactsDirectory, identity: directoryIdentity(stat) });
}

export async function revalidateQualificationObservationArtifactsDirectory(snapshot) {
  const safe = snapshotDirectoryState(snapshot, "qualification observation artifacts snapshot");
  const stat = await lstat(safe.path);
  if (!sameDirectoryIdentity(stat, safe.identity)) {
    throw new Error("qualification observation artifacts directory changed during publication");
  }
  return true;
}

export function snapshotQualificationObservationTemporaryIdentity(stat, expectedBytes) {
  if (!stat || typeof stat.isFile !== "function" || !stat.isFile() || stat.isSymbolicLink?.()) {
    throw new TypeError("qualification observation temporary handle must reference a regular file");
  }
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 0 || stat.size !== expectedBytes) {
    throw new TypeError("qualification observation temporary byte size is invalid");
  }
  return regularFileIdentity(stat);
}

export async function revalidateQualificationObservationTemporaryPath(path, identity) {
  const canonicalPath = assertCanonicalAbsolutePath(path, "qualification observation temporary path");
  const safeIdentity = snapshotRegularFileIdentity(identity, "qualification observation temporary identity");
  const stat = await lstat(canonicalPath);
  if (!sameRegularFileIdentity(stat, safeIdentity)) {
    throw new Error("qualification observation temporary pathname changed during publication");
  }
  return true;
}

export async function removeQualificationObservationTemporaryIfSame(path, identity) {
  if (path === undefined || path === null || identity === undefined || identity === null) return false;
  const canonicalPath = assertCanonicalAbsolutePath(path, "qualification observation temporary cleanup path");
  const safeIdentity = snapshotRegularFileIdentity(identity, "qualification observation temporary cleanup identity");
  let stat;
  try { stat = await lstat(canonicalPath); }
  catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  if (!sameRegularFileIdentity(stat, safeIdentity)) return false;
  await unlink(canonicalPath);
  return true;
}

export async function snapshotQualificationObservationTarget(outputPath, options) {
  const canonicalOutputPath = assertCanonicalAbsolutePath(outputPath, "qualification observation target path");
  const { allowMissing } = snapshotQualificationObservationTargetOptions(options);
  let stat;
  try { stat = await lstat(canonicalOutputPath); }
  catch (error) {
    if (allowMissing && error?.code === "ENOENT") return Object.freeze({ path: canonicalOutputPath, missing: true });
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new TypeError("qualification observation target must be a regular non-symlink file");
  }
  return Object.freeze({ path: canonicalOutputPath, missing: false, identity: regularFileIdentity(stat) });
}

export async function revalidateQualificationObservationTarget(snapshot) {
  const safe = snapshotTargetState(snapshot);
  if (safe.missing) {
    try { await lstat(safe.path); }
    catch (error) {
      if (error?.code === "ENOENT") return true;
      throw error;
    }
    throw new Error("qualification observation target appeared during publication");
  }
  const stat = await lstat(safe.path);
  if (!sameRegularFileIdentity(stat, safe.identity)) {
    throw new Error("qualification observation target changed during publication");
  }
  return true;
}

export async function verifyPublishedQualificationObservationTarget(outputPath, expectedBytes, expectedIdentity) {
  const canonicalOutputPath = assertCanonicalAbsolutePath(outputPath, "qualification observation published target path");
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 0) {
    throw new TypeError("qualification observation published byte size is invalid");
  }
  const safeExpectedIdentity = expectedIdentity === undefined
    ? null
    : snapshotRegularFileIdentity(expectedIdentity, "qualification observation published target identity");
  const stat = await lstat(canonicalOutputPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== expectedBytes) {
    throw new Error("qualification observation final publication is not the exact expected regular file");
  }
  if (safeExpectedIdentity && !sameRegularFileIdentity(stat, safeExpectedIdentity)) {
    throw new Error("qualification observation final publication is not the fsynced temporary file");
  }
  return true;
}
