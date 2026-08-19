import { assertCanonicalBuildInputPath } from "./build-input-discovery.mjs";

export const MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES = 256 * 1024 * 1024;
export const MAX_BUILD_INPUT_DESCRIPTORS = 100_000;

const BUILD_INPUT_KEYS = new Set(["path", "bytes", "sha256"]);
const SHA256_TEXT = /^[0-9a-f]{64}$/;

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
  if (!value || typeof value !== "object" || isArray || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError(`${label} must be a plain data object`);
  }
  if (keys.length !== allowedKeys.size || keys.some((key) => typeof key !== "string" || !allowedKeys.has(key))) {
    throw new TypeError(`${label} fields are invalid`);
  }
  const values = Object.create(null);
  for (const key of allowedKeys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label}.${key} must be an enumerable data field`);
    }
    values[key] = descriptor.value;
  }
  return values;
}

function snapshotBuildInputEntry(entry, index) {
  const values = exactDataObject(entry, BUILD_INPUT_KEYS, `Build input descriptor ${index}`);
  const path = assertCanonicalBuildInputPath(values.path);
  if (!Number.isSafeInteger(values.bytes) || values.bytes < 0 || values.bytes > MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES) {
    throw new TypeError(`Build input descriptor ${index}.bytes is invalid`);
  }
  if (typeof values.sha256 !== "string" || !SHA256_TEXT.test(values.sha256)) {
    throw new TypeError(`Build input descriptor ${index}.sha256 is invalid`);
  }
  return Object.freeze({ path, bytes: values.bytes, sha256: values.sha256 });
}

export function snapshotBuildFingerprintInputs(inputs) {
  let isArray;
  let keys;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(inputs);
    keys = Reflect.ownKeys(inputs);
    lengthDescriptor = Object.getOwnPropertyDescriptor(inputs, "length");
  } catch {
    throw new TypeError("Build inputs are not safely inspectable");
  }
  if (!isArray || !lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value)) {
    throw new TypeError("Build inputs must be a dense data array");
  }
  const length = lengthDescriptor.value;
  if (length <= 0 || length > MAX_BUILD_INPUT_DESCRIPTORS) throw new RangeError("Build input descriptor count is invalid");
  const keySet = new Set(keys);
  if (keys.length !== length + 1 || !keySet.has("length")) throw new TypeError("Build inputs must be a dense data array without extra fields");

  const result = [];
  const seen = new Set();
  let aggregateBytes = 0;
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keySet.has(key)) throw new TypeError("Build inputs must not contain holes");
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(inputs, key); }
    catch { throw new TypeError(`Build input ${index} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`Build input ${index} must be an enumerable data field`);
    const entry = snapshotBuildInputEntry(descriptor.value, index);
    aggregateBytes += entry.bytes;
    if (aggregateBytes > MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES) {
      throw new RangeError("Build input descriptor aggregate exceeds its byte ceiling");
    }
    if (seen.has(entry.path)) throw new TypeError(`Duplicate build input path: ${entry.path}`);
    seen.add(entry.path);
    result.push(entry);
  }
  return Object.freeze(result);
}
