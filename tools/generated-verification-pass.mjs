import { lstat } from "node:fs/promises";
import { isAbsolute, normalize, relative, resolve } from "node:path";
import {
  snapshotBuildInputDirectoryAncestry,
  revalidateBuildInputDirectoryAncestry
} from "./build-input-ancestry.mjs";

const PASS_KEYS = new Set(["distDirectory", "ancestry", "rootIdentity"]);
const ROOT_IDENTITY_KEYS = new Set(["size", "mtimeMs", "ctimeMs", "dev", "ino"]);
const ANCESTRY_ENTRY_KEYS = new Set(["path", "size", "mtimeMs", "ctimeMs", "dev", "ino"]);
const MAX_VERIFICATION_ANCESTRY_ENTRIES = 64;
const VERIFICATION_ROOT_SENTINEL = ".drop-ads-verification-root-sentinel";

function assertAbsoluteNormalizedDirectoryPath(value, label) {
  if (typeof value !== "string" || !value || !isAbsolute(value) || normalize(value) !== value) {
    throw new TypeError(`${label} must be an absolute normalized path`);
  }
  return value;
}

function freezeVerificationDirectoryIdentity(stat) {
  if (!Number.isSafeInteger(stat.size) || stat.size < 0) {
    throw new TypeError("Generated verification directory size metadata is invalid");
  }
  if (!Number.isFinite(stat.mtimeMs) || stat.mtimeMs < 0 || !Number.isFinite(stat.ctimeMs) || stat.ctimeMs < 0) {
    throw new TypeError("Generated verification directory time metadata is invalid");
  }
  return Object.freeze({
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs,
    dev: Number.isSafeInteger(stat.dev) ? stat.dev : null,
    ino: Number.isSafeInteger(stat.ino) ? stat.ino : null
  });
}

function snapshotRootIdentityState(identity) {
  if (!identity || typeof identity !== "object" || !Object.isFrozen(identity)) {
    throw new TypeError("Generated verification root identity must be a frozen data object");
  }
  const keys = Reflect.ownKeys(identity);
  if (keys.length !== ROOT_IDENTITY_KEYS.size || keys.some((key) => typeof key !== "string" || !ROOT_IDENTITY_KEYS.has(key))) {
    throw new TypeError("Generated verification root identity fields are invalid");
  }
  const values = Object.create(null);
  for (const key of ROOT_IDENTITY_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(identity, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable || descriptor.writable || descriptor.configurable) {
      throw new TypeError(`Generated verification root identity ${key} must be a frozen enumerable data field`);
    }
    values[key] = descriptor.value;
  }
  if (!Number.isSafeInteger(values.size) || values.size < 0) {
    throw new TypeError("Generated verification root identity size is invalid");
  }
  for (const key of ["mtimeMs", "ctimeMs"]) {
    if (!Number.isFinite(values[key]) || values[key] < 0) throw new TypeError(`Generated verification root identity ${key} is invalid`);
  }
  for (const key of ["dev", "ino"]) {
    if (values[key] !== null && !Number.isSafeInteger(values[key])) throw new TypeError(`Generated verification root identity ${key} is invalid`);
  }
  return values;
}

function sameRootIdentity(expected, stat) {
  if (expected.size !== stat.size || expected.mtimeMs !== stat.mtimeMs || expected.ctimeMs !== stat.ctimeMs) return false;
  if (expected.dev !== null && (!Number.isSafeInteger(stat.dev) || expected.dev !== stat.dev)) return false;
  if (expected.ino !== null && (!Number.isSafeInteger(stat.ino) || expected.ino !== stat.ino)) return false;
  return true;
}

async function requireRealVerificationDirectory(path, label) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new TypeError(`${label} must be a real non-symlink directory`);
  }
  return stat;
}

function verificationRootSentinel(root) {
  const sentinel = resolve(root, VERIFICATION_ROOT_SENTINEL);
  if (relative(root, sentinel) !== VERIFICATION_ROOT_SENTINEL) {
    throw new TypeError("Generated verification ancestry sentinel escaped or aliased its output root");
  }
  return sentinel;
}

function snapshotAncestryEntryState(entry, index) {
  if (!entry || typeof entry !== "object" || !Object.isFrozen(entry)) {
    throw new TypeError(`Generated verification pass ancestry entry ${index} must be a frozen data object`);
  }
  const keys = Reflect.ownKeys(entry);
  if (keys.length !== ANCESTRY_ENTRY_KEYS.size || keys.some((key) => typeof key !== "string" || !ANCESTRY_ENTRY_KEYS.has(key))) {
    throw new TypeError(`Generated verification pass ancestry entry ${index} fields are invalid`);
  }
  const values = Object.create(null);
  for (const key of ANCESTRY_ENTRY_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(entry, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable || descriptor.writable || descriptor.configurable) {
      throw new TypeError(`Generated verification pass ancestry entry ${index}.${key} must be a frozen enumerable data field`);
    }
    values[key] = descriptor.value;
  }
  values.path = assertAbsoluteNormalizedDirectoryPath(values.path, `Generated verification pass ancestry entry ${index}.path`);
  if (!Number.isSafeInteger(values.size) || values.size < 0) {
    throw new TypeError(`Generated verification pass ancestry entry ${index}.size is invalid`);
  }
  for (const key of ["mtimeMs", "ctimeMs"]) {
    if (!Number.isFinite(values[key]) || values[key] < 0) {
      throw new TypeError(`Generated verification pass ancestry entry ${index}.${key} is invalid`);
    }
  }
  for (const key of ["dev", "ino"]) {
    if (values[key] !== null && !Number.isSafeInteger(values[key])) {
      throw new TypeError(`Generated verification pass ancestry entry ${index}.${key} is invalid`);
    }
  }
  return values;
}

function assertAncestryRootMatchesPass(ancestry, distDirectory) {
  if (!Array.isArray(ancestry) || !Object.isFrozen(ancestry)) {
    throw new TypeError("Generated verification pass ancestry must be a frozen array");
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(ancestry, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value)) {
    throw new TypeError("Generated verification pass ancestry must contain a data length");
  }
  const length = lengthDescriptor.value;
  if (length <= 0 || length > MAX_VERIFICATION_ANCESTRY_ENTRIES) {
    throw new RangeError("Generated verification pass ancestry entry count is invalid");
  }
  const keys = Reflect.ownKeys(ancestry);
  const keySet = new Set(keys);
  if (keySet.size !== length + 1 || !keySet.has("length")) {
    throw new TypeError("Generated verification pass ancestry must be dense without extra fields");
  }
  let ancestryRoot = null;
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keySet.has(key)) throw new TypeError("Generated verification pass ancestry must not contain holes");
    const descriptor = Object.getOwnPropertyDescriptor(ancestry, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable || descriptor.writable || descriptor.configurable) {
      throw new TypeError(`Generated verification pass ancestry entry ${index} must be a frozen enumerable data entry`);
    }
    const entry = snapshotAncestryEntryState(descriptor.value, index);
    if (index === 0) ancestryRoot = entry.path;
  }
  if (ancestryRoot !== distDirectory) {
    throw new TypeError("Generated verification pass ancestry root does not match its output root");
  }
  return ancestry;
}

function snapshotPassState(pass) {
  if (!pass || typeof pass !== "object" || !Object.isFrozen(pass)) {
    throw new TypeError("Generated verification pass state must be a frozen data object");
  }
  const keys = Reflect.ownKeys(pass);
  if (keys.length !== PASS_KEYS.size || keys.some((key) => typeof key !== "string" || !PASS_KEYS.has(key))) {
    throw new TypeError("Generated verification pass state fields are invalid");
  }
  const values = Object.create(null);
  for (const key of PASS_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(pass, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable || descriptor.writable || descriptor.configurable) {
      throw new TypeError(`Generated verification pass state ${key} must be a frozen enumerable data field`);
    }
    values[key] = descriptor.value;
  }
  values.distDirectory = assertAbsoluteNormalizedDirectoryPath(values.distDirectory, "Generated verification pass directory");
  values.ancestry = assertAncestryRootMatchesPass(values.ancestry, values.distDirectory);
  values.rootIdentity = snapshotRootIdentityState(values.rootIdentity);
  return values;
}

export async function beginGeneratedVerificationPass(distDirectory) {
  const root = assertAbsoluteNormalizedDirectoryPath(distDirectory, "Generated verification output root");
  const rootStat = await requireRealVerificationDirectory(root, "Generated verification output root");
  const sentinel = verificationRootSentinel(root);
  const ancestry = await snapshotBuildInputDirectoryAncestry(root, sentinel);
  const rootIdentity = freezeVerificationDirectoryIdentity(rootStat);
  return Object.freeze({ distDirectory: root, ancestry, rootIdentity });
}

export async function finishGeneratedVerificationPass(pass) {
  const state = snapshotPassState(pass);
  const before = await requireRealVerificationDirectory(state.distDirectory, "Generated verification output root at finish");
  if (!sameRootIdentity(state.rootIdentity, before)) throw new Error("Generated verification output root identity changed before ancestry revalidation");
  await revalidateBuildInputDirectoryAncestry(state.ancestry);
  const after = await requireRealVerificationDirectory(state.distDirectory, "Generated verification output root after ancestry revalidation");
  if (!sameRootIdentity(state.rootIdentity, after)) throw new Error("Generated verification output root identity changed during ancestry revalidation");
  return true;
}
