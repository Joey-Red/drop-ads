import { lstat } from "node:fs/promises";
import { dirname, isAbsolute, normalize, relative, resolve, sep } from "node:path";

export const MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES = 64;

const SNAPSHOT_KEYS = new Set(["path", "size", "mtimeMs", "ctimeMs", "dev", "ino"]);

function assertAbsoluteNormalizedPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || !isAbsolute(value) || normalize(value) !== value) {
    throw new TypeError(`${label} must be an absolute normalized path`);
  }
  return value;
}

function snapshotDirectory(path, stat) {
  return Object.freeze({
    path,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs,
    dev: Number.isSafeInteger(stat.dev) ? stat.dev : null,
    ino: Number.isSafeInteger(stat.ino) ? stat.ino : null
  });
}

async function requireRealDirectory(path, label) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError(`${label} must be a real non-symlink directory`);
  return stat;
}

function relativeDirectoryParts(rootDirectory, filePath) {
  const parent = dirname(filePath);
  const value = relative(rootDirectory, parent);
  if (value === "") return [];
  if (value === ".." || value.startsWith(`..${sep}`) || isAbsolute(value)) throw new TypeError("Build input file ancestry escapes the repository root");
  const parts = value.split(sep);
  if (parts.some((part) => !part || part === "." || part === "..")) throw new TypeError("Build input file ancestry is not canonical");
  if (parts.length > MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES - 1) throw new RangeError("Build input file ancestry exceeds its directory depth ceiling");
  return parts;
}

function snapshotEntryValues(value, index) {
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`Build input ancestry snapshot ${index} is not safely inspectable`);
  }
  if (!value || typeof value !== "object" || (prototype !== Object.prototype && prototype !== null) || !Object.isFrozen(value)) {
    throw new TypeError(`Build input ancestry snapshot ${index} must be a frozen data object`);
  }
  if (keys.length !== SNAPSHOT_KEYS.size || keys.some((key) => typeof key !== "string" || !SNAPSHOT_KEYS.has(key))) {
    throw new TypeError(`Build input ancestry snapshot ${index} fields are invalid`);
  }
  const result = Object.create(null);
  for (const key of SNAPSHOT_KEYS) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`Build input ancestry snapshot ${index}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`Build input ancestry snapshot ${index}.${key} must be an enumerable data field`);
    }
    result[key] = descriptor.value;
  }
  assertAbsoluteNormalizedPath(result.path, `Build input ancestry snapshot ${index}.path`);
  if (!Number.isSafeInteger(result.size) || result.size < 0 || !Number.isFinite(result.mtimeMs) || !Number.isFinite(result.ctimeMs)) {
    throw new TypeError(`Build input ancestry snapshot ${index} metadata is invalid`);
  }
  if ((result.dev !== null && !Number.isSafeInteger(result.dev)) || (result.ino !== null && !Number.isSafeInteger(result.ino))) {
    throw new TypeError(`Build input ancestry snapshot ${index} identity is invalid`);
  }
  return result;
}

function snapshotEntries(snapshots) {
  let keys;
  let lengthDescriptor;
  try {
    if (!Array.isArray(snapshots) || !Object.isFrozen(snapshots)) throw new TypeError("Build input ancestry snapshots must be a frozen array");
    keys = Reflect.ownKeys(snapshots);
    lengthDescriptor = Object.getOwnPropertyDescriptor(snapshots, "length");
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError("Build input ancestry snapshots are not safely inspectable");
  }
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value)) {
    throw new TypeError("Build input ancestry snapshots must have a data length");
  }
  const length = lengthDescriptor.value;
  if (length <= 0 || length > MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES) throw new RangeError("Build input ancestry snapshot count is invalid");
  const keySet = new Set(keys);
  if (keySet.size !== length + 1 || !keySet.has("length")) throw new TypeError("Build input ancestry snapshots must be dense without extra fields");
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keySet.has(key)) throw new TypeError("Build input ancestry snapshots must not contain holes");
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(snapshots, key); }
    catch { throw new TypeError(`Build input ancestry snapshot ${index} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`Build input ancestry snapshot ${index} must be an enumerable data field`);
    result.push(snapshotEntryValues(descriptor.value, index));
  }
  return result;
}

export async function snapshotBuildInputDirectoryAncestry(rootDirectory, filePath) {
  const root = assertAbsoluteNormalizedPath(rootDirectory, "Build input ancestry root");
  const file = assertAbsoluteNormalizedPath(filePath, "Build input ancestry file");
  const parts = relativeDirectoryParts(root, file);
  const snapshots = [];
  let current = root;
  snapshots.push(snapshotDirectory(current, await requireRealDirectory(current, "Build input ancestry root")));
  for (const part of parts) {
    current = resolve(current, part);
    snapshots.push(snapshotDirectory(current, await requireRealDirectory(current, "Build input ancestry directory")));
  }
  if (snapshots.length > MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES) throw new RangeError("Build input file ancestry exceeds its directory ceiling");
  return Object.freeze(snapshots);
}

export async function revalidateBuildInputDirectoryAncestry(snapshots) {
  const entries = snapshotEntries(snapshots);
  for (let index = 0; index < entries.length; index += 1) {
    const expected = entries[index];
    const current = await requireRealDirectory(expected.path, `Build input ancestry directory ${index}`);
    if (current.size !== expected.size || current.mtimeMs !== expected.mtimeMs || current.ctimeMs !== expected.ctimeMs) {
      throw new Error(`Build input ancestry directory changed while hashing: ${expected.path}`);
    }
    if (expected.dev !== null && current.dev !== expected.dev) throw new Error(`Build input ancestry directory identity changed while hashing: ${expected.path}`);
    if (expected.ino !== null && current.ino !== expected.ino) throw new Error(`Build input ancestry directory identity changed while hashing: ${expected.path}`);
  }
  return true;
}
