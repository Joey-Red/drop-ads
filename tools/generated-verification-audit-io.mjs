import { lstat, open } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import {
  GENERATED_VERIFICATION_AUDIT_LIMITS,
  assertGeneratedVerificationAuditSourceByteCeiling
} from "./generated-verification-audit-limits.mjs";

const MAX_PATH_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPathBytes;
const MAX_ALLOWED_SOURCE_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxSourceBytes;
const MAX_AUDIT_ANCESTRY_DEPTH = GENERATED_VERIFICATION_AUDIT_LIMITS.maxAncestryDepth;
const AUDIT_IDENTITY_KEYS = Object.freeze(["dev", "ino", "mode", "nlink", "size", "mtimeMs", "ctimeMs"]);
const AUDIT_ANCESTRY_ENTRY_KEYS = Object.freeze(["path", "state"]);
const AUDIT_ROOT_SNAPSHOT_KEYS = Object.freeze(["path", "state"]);
const AUDIT_PATH_CONTROL_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

function assertAuditPathText(path) {
  if (typeof path !== "string" || path.length === 0 || Buffer.byteLength(path, "utf8") > MAX_PATH_BYTES) throw new Error("generated-verification audit source path is invalid or too long");
  if (!path.isWellFormed()) throw new Error("generated-verification audit source path must be well-formed Unicode");
  if (path.normalize("NFC") !== path) throw new Error("generated-verification audit source path must use NFC Unicode");
  if (AUDIT_PATH_CONTROL_TEXT.test(path)) throw new Error("generated-verification audit source path contains forbidden control text");
  if (isAbsolute(path) || path.includes("\\")) throw new Error("generated-verification audit source path must be canonical repository-relative text");
  return path;
}

function assertCanonicalAuditAbsolutePath(path) {
  if (typeof path !== "string" || path.length === 0 || !isAbsolute(path) || resolve(path) !== path || path.includes("\u0000")) throw new Error("generated-verification audit ancestry path must be an absolute normalized path");
  return path;
}

export function freezeGeneratedVerificationAuditPathSnapshot(path, segmentInventory) {
  const canonicalPath = assertAuditPathText(path);
  if (!Array.isArray(segmentInventory)) throw new Error("generated-verification audit source path segments must be an array");
  const lengthDescriptor = Object.getOwnPropertyDescriptor(segmentInventory, "length");
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length <= 0 || length - 1 > MAX_AUDIT_ANCESTRY_DEPTH) throw new Error(`generated-verification audit source ancestry exceeds ${MAX_AUDIT_ANCESTRY_DEPTH} directories`);
  const keys = Reflect.ownKeys(segmentInventory);
  if (keys.length !== length + 1) throw new Error("generated-verification audit source path segments must be a dense exact array");
  const segments = [];
  let reconstructed = "";
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keys.includes(key)) throw new Error("generated-verification audit source path segments must be a dense exact array");
    const descriptor = Object.getOwnPropertyDescriptor(segmentInventory, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`generated-verification audit source path segment ${index} must be an own data property`);
    const segment = descriptor.value;
    if (typeof segment !== "string" || segment === "" || segment === "." || segment === "..") throw new Error("generated-verification audit source path contains a forbidden segment");
    if (!segment.isWellFormed() || segment.normalize("NFC") !== segment || AUDIT_PATH_CONTROL_TEXT.test(segment) || segment.includes("/") || segment.includes("\\")) throw new Error("generated-verification audit source path segment is not canonical text");
    segments.push(segment);
    reconstructed += `${index === 0 ? "" : "/"}${segment}`;
  }
  for (const key of keys) if (key !== "length" && (typeof key !== "string" || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)) throw new Error("generated-verification audit source path segments must be a dense exact array");
  if (reconstructed !== canonicalPath) throw new Error("generated-verification audit source path segments do not reconstruct the canonical path");
  return Object.freeze({ path: canonicalPath, segments: Object.freeze(segments) });
}

export function snapshotGeneratedVerificationAuditPath(path) {
  const canonicalPath = assertAuditPathText(path);
  return freezeGeneratedVerificationAuditPathSnapshot(canonicalPath, canonicalPath.split("/"));
}

export function freezeGeneratedVerificationAuditSourceResult(path, source, bytes) {
  const canonical = snapshotGeneratedVerificationAuditPath(path);
  if (typeof source !== "string" || !source.isWellFormed()) throw new Error("generated-verification audit source result text must be well-formed Unicode");
  if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > MAX_ALLOWED_SOURCE_BYTES || Buffer.byteLength(source, "utf8") !== bytes) throw new Error("generated-verification audit source result byte count does not match source text");
  return Object.freeze({ path: canonical.path, source, bytes });
}

export function freezeGeneratedVerificationAuditIdentity(candidate) {
  if (candidate === null || typeof candidate !== "object") throw new Error("generated-verification audit filesystem identity must be an object");
  const values = Object.create(null);
  for (const key of AUDIT_IDENTITY_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`generated-verification audit filesystem identity ${key} must be an own data property`);
    if (typeof descriptor.value !== "number" || !Number.isFinite(descriptor.value)) throw new Error(`generated-verification audit filesystem identity ${key} must be finite numeric metadata`);
    values[key] = descriptor.value;
  }
  if (!Number.isSafeInteger(values.mode) || values.mode < 0 || !Number.isSafeInteger(values.nlink) || values.nlink < 0 || !Number.isSafeInteger(values.size) || values.size < 0) throw new Error("generated-verification audit filesystem identity integer metadata is invalid");
  return Object.freeze({ dev: values.dev, ino: values.ino, mode: values.mode, nlink: values.nlink, size: values.size, mtimeMs: values.mtimeMs, ctimeMs: values.ctimeMs });
}

export function snapshotGeneratedVerificationAuditIdentityTuple(candidate, label = "generated-verification audit filesystem identity") {
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Object.prototype || !Object.isFrozen(candidate)) throw new Error(`${label} tuple must be a frozen plain object`);
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== AUDIT_IDENTITY_KEYS.length || keys.some((key) => typeof key !== "string" || !AUDIT_IDENTITY_KEYS.includes(key))) throw new Error(`${label} tuple must contain exactly the reviewed identity fields`);
  const values = Object.create(null);
  for (const key of AUDIT_IDENTITY_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`${label} tuple ${key} must be an own data property`);
    values[key] = descriptor.value;
  }
  return freezeGeneratedVerificationAuditIdentity(values);
}

export function freezeGeneratedVerificationAuditAncestryEntry(path, state) {
  return Object.freeze({ path: assertCanonicalAuditAbsolutePath(path), state: freezeGeneratedVerificationAuditIdentity(state) });
}

export function snapshotGeneratedVerificationAuditAncestryEntry(candidate, index = 0) {
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Object.prototype || !Object.isFrozen(candidate)) throw new Error(`generated-verification audit ancestry entry ${index} must be a frozen plain object`);
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== AUDIT_ANCESTRY_ENTRY_KEYS.length || keys.some((key) => typeof key !== "string" || !AUDIT_ANCESTRY_ENTRY_KEYS.includes(key))) throw new Error(`generated-verification audit ancestry entry ${index} must contain exactly path and state`);
  const values = Object.create(null);
  for (const key of AUDIT_ANCESTRY_ENTRY_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`generated-verification audit ancestry entry ${index} ${key} must be an own data property`);
    values[key] = descriptor.value;
  }
  return freezeGeneratedVerificationAuditAncestryEntry(values.path, values.state);
}

export function freezeGeneratedVerificationAuditAncestryInventory(candidate) {
  if (!Array.isArray(candidate)) throw new Error("generated-verification audit ancestry inventory must be an array");
  const lengthDescriptor = Object.getOwnPropertyDescriptor(candidate, "length");
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_AUDIT_ANCESTRY_DEPTH) throw new Error(`generated-verification audit ancestry inventory exceeds ${MAX_AUDIT_ANCESTRY_DEPTH} entries`);
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== length + 1) throw new Error("generated-verification audit ancestry inventory must be a dense exact array");
  const snapshot = [];
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keys.includes(key)) throw new Error("generated-verification audit ancestry inventory must be a dense exact array");
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`generated-verification audit ancestry inventory index ${index} must be an own data property`);
    snapshot.push(snapshotGeneratedVerificationAuditAncestryEntry(descriptor.value, index));
  }
  for (const key of keys) if (key !== "length" && (typeof key !== "string" || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)) throw new Error("generated-verification audit ancestry inventory must be a dense exact array");
  return Object.freeze(snapshot);
}

export function freezeGeneratedVerificationAuditRootSnapshot(path, state) {
  return Object.freeze({ path: assertCanonicalAuditAbsolutePath(path), state: freezeGeneratedVerificationAuditIdentity(state) });
}

export function snapshotGeneratedVerificationAuditRootSnapshot(candidate) {
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Object.prototype || !Object.isFrozen(candidate)) throw new Error("generated-verification audit repository root snapshot must be a frozen plain object");
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== AUDIT_ROOT_SNAPSHOT_KEYS.length || keys.some((key) => typeof key !== "string" || !AUDIT_ROOT_SNAPSHOT_KEYS.includes(key))) throw new Error("generated-verification audit repository root snapshot must contain exactly path and state");
  const values = Object.create(null);
  for (const key of AUDIT_ROOT_SNAPSHOT_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`generated-verification audit repository root snapshot ${key} must be an own data property`);
    values[key] = descriptor.value;
  }
  const snapshot = freezeGeneratedVerificationAuditRootSnapshot(values.path, values.state);
  return Object.freeze({ path: snapshot.path, state: snapshotGeneratedVerificationAuditIdentityTuple(snapshot.state, "generated-verification audit repository root identity") });
}

function assertStableIdentity(expected, actual, path, phase) {
  const expectedTuple = snapshotGeneratedVerificationAuditIdentityTuple(expected, `${path} expected identity`);
  const actualTuple = snapshotGeneratedVerificationAuditIdentityTuple(actual, `${path} actual identity`);
  for (const key of AUDIT_IDENTITY_KEYS) if (expectedTuple[key] !== actualTuple[key]) throw new Error(`${path} changed ${phase}`);
}

async function snapshotAuditRoot(root) {
  const state = await lstat(root);
  if (state.isSymbolicLink() || !state.isDirectory()) throw new Error("generated-verification audit repository root must be a real non-symlink directory");
  return freezeGeneratedVerificationAuditRootSnapshot(root, state);
}

async function snapshotAuditSourceAncestry(root, segments) {
  const ancestry = [];
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = resolve(current, segments[index]);
    const state = await lstat(current);
    if (state.isSymbolicLink() || !state.isDirectory()) throw new Error("generated-verification audit source ancestry must contain only real non-symlink directories");
    ancestry.push(freezeGeneratedVerificationAuditAncestryEntry(current, state));
  }
  return freezeGeneratedVerificationAuditAncestryInventory(ancestry);
}

async function revalidateAuditSourceAncestry(ancestry) {
  const inventory = freezeGeneratedVerificationAuditAncestryInventory(ancestry);
  for (let index = 0; index < inventory.length; index += 1) {
    const entry = inventory[index];
    const state = await lstat(entry.path);
    if (state.isSymbolicLink() || !state.isDirectory()) throw new Error("generated-verification audit source ancestry changed type during bounded read");
    assertStableIdentity(entry.state, freezeGeneratedVerificationAuditIdentity(state), "generated-verification audit source ancestry", "during bounded read");
  }
}

function resolveAuditSourcePath(root, segments) {
  let current = root;
  for (let index = 0; index < segments.length; index += 1) current = resolve(current, segments[index]);
  return current;
}

async function readOpenedAuditSourceBounded(handle, maxBytes, path) {
  const buffer = Buffer.allocUnsafe(maxBytes + 1);
  let offset = 0;
  while (offset < buffer.length) {
    const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
    if (bytesRead === 0) break;
    offset += bytesRead;
  }
  if (offset > maxBytes) throw new Error(`${path} exceeded its ${maxBytes}-byte ceiling during bounded generated-verification audit read`);
  return buffer.subarray(0, offset);
}

export async function readGeneratedVerificationAuditSource(rootDirectory, relativePath, maxBytes) {
  const root = resolve(rootDirectory);
  const rootSnapshot = snapshotGeneratedVerificationAuditRootSnapshot(await snapshotAuditRoot(root));
  if (rootSnapshot.path !== root) throw new Error("generated-verification audit repository root snapshot path mismatch");
  const canonical = snapshotGeneratedVerificationAuditPath(relativePath);
  const { path, segments } = canonical;
  const admittedMaxBytes = assertGeneratedVerificationAuditSourceByteCeiling(maxBytes);
  const fullPath = resolveAuditSourcePath(root, segments);
  if (fullPath !== root && !fullPath.startsWith(`${root}${sep}`)) throw new Error("generated-verification audit source path escapes repository root");
  const ancestry = await snapshotAuditSourceAncestry(root, segments);
  const pathStat = await lstat(fullPath);
  if (pathStat.isSymbolicLink() || !pathStat.isFile()) throw new Error(`${path} must be a regular non-symlink audit source file`);
  if (!Number.isSafeInteger(pathStat.size) || pathStat.size < 0 || pathStat.size > admittedMaxBytes) throw new Error(`${path} exceeds its ${admittedMaxBytes}-byte generated-verification audit source ceiling`);
  const pathState = freezeGeneratedVerificationAuditIdentity(pathStat);
  const handle = await open(fullPath, "r");
  try {
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) throw new Error(`${path} must remain a regular audit source file`);
    const opened = freezeGeneratedVerificationAuditIdentity(openedStat);
    assertStableIdentity(pathState, opened, path, "before bounded read");
    const bytes = await readOpenedAuditSourceBounded(handle, admittedMaxBytes, path);
    if (bytes.length !== opened.size) throw new Error(`${path} changed size during bounded generated-verification audit read`);
    let source;
    try { source = UTF8_DECODER.decode(bytes); }
    catch { throw new Error(`${path} is not strict UTF-8 audit source text`); }
    const afterStat = await handle.stat();
    const after = freezeGeneratedVerificationAuditIdentity(afterStat);
    assertStableIdentity(opened, after, path, "during bounded read");
    const pathAfterStat = await lstat(fullPath);
    if (pathAfterStat.isSymbolicLink() || !pathAfterStat.isFile()) throw new Error(`${path} pathname changed type during bounded generated-verification audit read`);
    const pathAfter = freezeGeneratedVerificationAuditIdentity(pathAfterStat);
    assertStableIdentity(pathState, pathAfter, path, "at pathname during bounded read");
    await revalidateAuditSourceAncestry(ancestry);
    const rootAfter = snapshotGeneratedVerificationAuditRootSnapshot(await snapshotAuditRoot(root));
    if (rootAfter.path !== rootSnapshot.path) throw new Error("generated-verification audit repository root path changed during bounded read");
    assertStableIdentity(rootSnapshot.state, rootAfter.state, "generated-verification audit repository root", "during bounded read");
    return freezeGeneratedVerificationAuditSourceResult(path, source, bytes.length);
  } finally {
    await handle.close();
  }
}
