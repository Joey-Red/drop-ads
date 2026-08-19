import { lstat, open } from "node:fs/promises";

export const QUALIFICATION_PACKAGE_MAX_BYTES = 256 * 1024;
export const QUALIFICATION_RECORD_MAX_BYTES = 256 * 1024;
export const QUALIFICATION_OBSERVATION_MAX_BYTES = 1024 * 1024;

const READ_CHUNK_BYTES = 64 * 1024;
const MAX_ITERATOR_DESCRIPTOR_DEPTH = 8;
const FILE_OPTION_KEYS = Object.freeze(["maxBytes", "label", "allowEmpty", "allowMissing"]);
const STREAM_OPTION_KEYS = Object.freeze(["maxBytes", "label", "allowEmpty"]);
const PATH_OPTION_KEYS = Object.freeze(["allowMissing", "label"]);
const FILE_IDENTITY_KEYS = Object.freeze(["dev", "ino", "size", "mtimeMs", "ctimeMs"]);

function decodeStrictUtf8(bytes, label, allowEmpty) {
  if (!allowEmpty && bytes.length === 0) throw new TypeError(`${label} must not be empty`);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new TypeError(`${label} must be strict UTF-8`);
  }
}

function validateReadOptions(maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError("qualification input maxBytes must be a positive safe integer");
  }
}

function snapshotOwnData(candidate, allowedKeys, label) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new TypeError(`${label} must be an object`);
  }
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(candidate);
    keys = Reflect.ownKeys(candidate);
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain data object`);
  }
  const allowed = new Set(allowedKeys);
  if (keys.some((key) => typeof key !== "string" || !allowed.has(key))) {
    throw new TypeError(`${label} fields are invalid`);
  }
  const values = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(candidate, key); }
    catch { throw new TypeError(`${label}.${String(key)} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label}.${String(key)} must be an enumerable own data field`);
    }
    values[key] = descriptor.value;
  }
  return values;
}

function snapshotReadOptions(options, allowedKeys, defaultLabel, allowMissingKey) {
  const candidate = options === undefined ? {} : options;
  const values = snapshotOwnData(candidate, allowedKeys, "qualification read options");
  validateReadOptions(values.maxBytes);
  const label = values.label === undefined ? defaultLabel : values.label;
  if (typeof label !== "string" || !label) throw new TypeError("qualification read label must be nonempty text");
  const allowEmpty = values.allowEmpty === undefined ? false : values.allowEmpty;
  if (typeof allowEmpty !== "boolean") throw new TypeError("qualification read allowEmpty must be boolean");
  const allowMissing = allowMissingKey
    ? (values.allowMissing === undefined ? false : values.allowMissing)
    : false;
  if (allowMissingKey && typeof allowMissing !== "boolean") throw new TypeError("qualification read allowMissing must be boolean");
  return Object.freeze({ maxBytes: values.maxBytes, label, allowEmpty, allowMissing });
}

export function snapshotQualificationFileReadOptions(options) {
  return snapshotReadOptions(options, FILE_OPTION_KEYS, "qualification file", true);
}

export function snapshotQualificationStreamReadOptions(options) {
  return snapshotReadOptions(options, STREAM_OPTION_KEYS, "qualification input", false);
}

export function snapshotQualificationPathReadOptions(options) {
  const candidate = options === undefined ? {} : options;
  const values = snapshotOwnData(candidate, PATH_OPTION_KEYS, "qualification path options");
  const label = values.label === undefined ? "qualification file" : values.label;
  if (typeof label !== "string" || !label) throw new TypeError("qualification path label must be nonempty text");
  const allowMissing = values.allowMissing === undefined ? false : values.allowMissing;
  if (typeof allowMissing !== "boolean") throw new TypeError("qualification path allowMissing must be boolean");
  return Object.freeze({ allowMissing, label });
}

function fileIdentity(stat) {
  return Object.freeze({
    dev: stat.dev,
    ino: stat.ino,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs
  });
}

function sameFileIdentity(stat, identity) {
  return stat.isFile() && !stat.isSymbolicLink()
    && stat.dev === identity.dev && stat.ino === identity.ino && stat.size === identity.size
    && stat.mtimeMs === identity.mtimeMs && stat.ctimeMs === identity.ctimeMs;
}

function snapshotQualificationUtf8PathState(candidate) {
  const values = snapshotOwnData(candidate, ["path", "missing", "identity"], "qualification pathname snapshot");
  const present = Reflect.ownKeys(values);
  if (typeof values.path !== "string" || !values.path) throw new TypeError("qualification pathname snapshot path must be nonempty text");
  if (typeof values.missing !== "boolean") throw new TypeError("qualification pathname snapshot missing flag must be boolean");
  if (values.missing) {
    if (present.length !== 2 || !Object.hasOwn(values, "path") || !Object.hasOwn(values, "missing")) {
      throw new TypeError("missing qualification pathname snapshot fields are invalid");
    }
    return Object.freeze({ path: values.path, missing: true });
  }
  if (present.length !== 3 || !Object.hasOwn(values, "identity")) {
    throw new TypeError("qualification pathname snapshot identity is required");
  }
  const identityValues = snapshotOwnData(values.identity, FILE_IDENTITY_KEYS, "qualification pathname identity");
  if (Reflect.ownKeys(identityValues).length !== FILE_IDENTITY_KEYS.length) {
    throw new TypeError("qualification pathname identity fields are incomplete");
  }
  for (const key of FILE_IDENTITY_KEYS) {
    if (!Number.isFinite(identityValues[key])) throw new TypeError(`qualification pathname identity ${key} must be finite`);
  }
  const identity = Object.freeze({
    dev: identityValues.dev,
    ino: identityValues.ino,
    size: identityValues.size,
    mtimeMs: identityValues.mtimeMs,
    ctimeMs: identityValues.ctimeMs
  });
  return Object.freeze({ path: values.path, missing: false, identity });
}

export async function snapshotQualificationUtf8FilePath(path, options) {
  if (typeof path !== "string" || !path) throw new TypeError("qualification file path must be nonempty text");
  const pathOptions = snapshotQualificationPathReadOptions(options);
  let stat;
  try { stat = await lstat(path); }
  catch (error) {
    if (pathOptions.allowMissing && error?.code === "ENOENT") return Object.freeze({ path, missing: true });
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new TypeError(`${pathOptions.label} must be a regular non-symlink file`);
  return Object.freeze({ path, missing: false, identity: fileIdentity(stat) });
}

export async function revalidateQualificationUtf8FilePath(snapshot, label = "qualification file") {
  if (typeof label !== "string" || !label) throw new TypeError("qualification path label must be nonempty text");
  const safeSnapshot = snapshotQualificationUtf8PathState(snapshot);
  if (safeSnapshot.missing) {
    try { await lstat(safeSnapshot.path); }
    catch (error) {
      if (error?.code === "ENOENT") return true;
      throw error;
    }
    throw new Error(`${label} appeared during bounded read`);
  }
  const stat = await lstat(safeSnapshot.path);
  if (!sameFileIdentity(stat, safeSnapshot.identity)) throw new Error(`${label} changed during bounded read`);
  return true;
}

export async function readQualificationUtf8File(path, options) {
  const readOptions = snapshotQualificationFileReadOptions(options);
  const { maxBytes, label, allowEmpty, allowMissing } = readOptions;
  const pathnameSnapshot = await snapshotQualificationUtf8FilePath(path, { allowMissing, label });
  if (pathnameSnapshot.missing) return null;

  let handle;
  try {
    handle = await open(path, "r");
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") throw new Error(`${label} disappeared between pathname admission and open`);
    throw error;
  }

  try {
    let stat = await handle.stat();
    if (!sameFileIdentity(stat, pathnameSnapshot.identity)) {
      throw new Error(`${label} changed between pathname admission and open`);
    }
    if (stat.size > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} bytes`);

    const chunks = [];
    let total = 0;
    while (true) {
      const remaining = maxBytes + 1 - total;
      if (remaining <= 0) throw new RangeError(`${label} exceeds ${maxBytes} bytes`);
      const buffer = Buffer.allocUnsafe(Math.min(READ_CHUNK_BYTES, remaining));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      if (total > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} bytes`);
      chunks.push(buffer.subarray(0, bytesRead));
    }

    stat = await handle.stat();
    if (!sameFileIdentity(stat, pathnameSnapshot.identity)) throw new Error(`${label} changed during bounded read`);
    const decoded = decodeStrictUtf8(Buffer.concat(chunks, total), label, allowEmpty);
    return decoded;
  } finally {
    await handle.close();
    await revalidateQualificationUtf8FilePath(pathnameSnapshot, label);
  }
}

function capturePrototypeDataFunction(target, key, label, { optional = false } = {}) {
  if (!target || (typeof target !== "object" && typeof target !== "function")) {
    if (optional) return null;
    throw new TypeError(`${label} target is invalid`);
  }
  const visited = new Set();
  let current = target;
  for (let depth = 0; depth <= MAX_ITERATOR_DESCRIPTOR_DEPTH && current; depth += 1) {
    if (visited.has(current)) throw new TypeError(`${label} prototype chain is cyclic`);
    visited.add(current);
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} descriptor is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        throw new TypeError(`${label} must resolve to a data-function descriptor`);
      }
      return descriptor.value;
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (current) throw new TypeError(`${label} exceeds descriptor depth limit`);
  if (optional) return null;
  throw new TypeError(`${label} is unavailable`);
}

function snapshotIteratorResult(candidate) {
  const values = snapshotOwnData(candidate, ["value", "done"], "qualification stream iterator result");
  const keys = Reflect.ownKeys(values);
  if (!Object.hasOwn(values, "done") || typeof values.done !== "boolean") {
    throw new TypeError("qualification stream iterator result.done must be an own boolean data field");
  }
  if (!values.done && !Object.hasOwn(values, "value")) {
    throw new TypeError("qualification stream iterator result.value is required before completion");
  }
  if (keys.length > 2) throw new TypeError("qualification stream iterator result fields are invalid");
  return Object.freeze({ done: values.done, value: values.value });
}

export async function readQualificationUtf8Stream(stream, options) {
  const readOptions = snapshotQualificationStreamReadOptions(options);
  const { maxBytes, label, allowEmpty } = readOptions;
  const iteratorFactory = capturePrototypeDataFunction(stream, Symbol.asyncIterator, "qualification input async iterator");
  const iterator = iteratorFactory.call(stream);
  if (!iterator || typeof iterator !== "object") throw new TypeError("qualification input async iterator must return an object");
  const next = capturePrototypeDataFunction(iterator, "next", "qualification input iterator next");
  const iteratorReturn = capturePrototypeDataFunction(iterator, "return", "qualification input iterator return", { optional: true });

  const chunks = [];
  let total = 0;
  let completed = false;
  try {
    while (true) {
      const result = snapshotIteratorResult(await next.call(iterator));
      if (result.done) {
        completed = true;
        break;
      }
      const chunk = result.value;
      if (!(chunk instanceof Uint8Array)) throw new TypeError(`${label} stream must yield bytes`);
      total += chunk.byteLength;
      if (total > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} bytes`);
      chunks.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
    }
  } finally {
    if (!completed && iteratorReturn) {
      try { await iteratorReturn.call(iterator); } catch {}
    }
  }
  return decodeStrictUtf8(Buffer.concat(chunks, total), label, allowEmpty);
}
