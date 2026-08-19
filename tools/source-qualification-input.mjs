const UNSAFE_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;
export const MAX_SOURCE_QUALIFICATION_IDS = 64;
export const MAX_SOURCE_ID_CHARS = 128;
export const MAX_SOURCE_HEAD_TIMEOUT_MS = 30_000;

const DEFAULT_SET_TIMEOUT = setTimeout;
const DEFAULT_CLEAR_TIMEOUT = clearTimeout;
const DEFAULT_ABORT_CONTROLLER = AbortController;

function dataDescriptor(object, key, label) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
  catch { throw new TypeError(`${label}.${String(key)} is not safely inspectable`); }
  if (!descriptor || !("value" in descriptor)) throw new TypeError(`${label}.${String(key)} must be a data property`);
  return descriptor;
}

function plainOptionObject(options, allowedKeys, label) {
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(options);
    keys = Reflect.ownKeys(options);
  } catch {
    throw new TypeError(`${label} are not safely inspectable`);
  }
  if (!options || typeof options !== "object" || Array.isArray(options) || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  if (keys.some((key) => typeof key !== "string" || !allowedKeys.includes(key))) throw new TypeError(`${label} fields are invalid`);
  return keys;
}

export function snapshotSourceQualificationIds(ids) {
  let isArray;
  let prototype;
  let keys;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(ids);
    prototype = Object.getPrototypeOf(ids);
    keys = Reflect.ownKeys(ids);
    lengthDescriptor = Object.getOwnPropertyDescriptor(ids, "length");
  } catch {
    throw new TypeError("Source qualification ids are not safely inspectable");
  }
  if (!isArray || prototype !== Array.prototype || !lengthDescriptor || !("value" in lengthDescriptor)) throw new TypeError("Source qualification ids must be a standard dense array");
  const length = lengthDescriptor.value;
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_SOURCE_QUALIFICATION_IDS) throw new RangeError("Source qualification id count is invalid");
  if (keys.length !== length + 1 || !keys.includes("length")) throw new TypeError("Source qualification ids must be dense without extra fields");
  const result = [];
  const seen = new Set();
  for (let index = 0; index < length; index += 1) {
    const descriptor = dataDescriptor(ids, String(index), "Source qualification ids");
    if (!descriptor.enumerable) throw new TypeError(`Source qualification ids[${index}] must be enumerable`);
    const id = descriptor.value;
    if (typeof id !== "string" || !id || id.length > MAX_SOURCE_ID_CHARS || UNSAFE_TEXT.test(id)) throw new TypeError(`Source qualification id ${index} is invalid`);
    if (seen.has(id)) throw new TypeError(`Duplicate source qualification id: ${id}`);
    seen.add(id);
    result.push(id);
  }
  return Object.freeze(result);
}

export function snapshotHeadDiagnosticOptions(options, defaultTimeoutMs = 5_000) {
  if (!Number.isSafeInteger(defaultTimeoutMs) || defaultTimeoutMs <= 0 || defaultTimeoutMs > MAX_SOURCE_HEAD_TIMEOUT_MS) throw new RangeError("Default source HEAD timeout is invalid");
  if (options === undefined) return Object.freeze({ timeoutMs: defaultTimeoutMs, setTimeoutImpl: DEFAULT_SET_TIMEOUT, clearTimeoutImpl: DEFAULT_CLEAR_TIMEOUT, AbortControllerImpl: DEFAULT_ABORT_CONTROLLER });
  const keys = plainOptionObject(options, ["timeoutMs", "setTimeoutImpl", "clearTimeoutImpl", "AbortControllerImpl"], "Source HEAD options");
  const timeoutMs = keys.includes("timeoutMs") ? dataDescriptor(options, "timeoutMs", "Source HEAD options").value : defaultTimeoutMs;
  const setTimeoutImpl = keys.includes("setTimeoutImpl") ? dataDescriptor(options, "setTimeoutImpl", "Source HEAD options").value : DEFAULT_SET_TIMEOUT;
  const clearTimeoutImpl = keys.includes("clearTimeoutImpl") ? dataDescriptor(options, "clearTimeoutImpl", "Source HEAD options").value : DEFAULT_CLEAR_TIMEOUT;
  const AbortControllerImpl = keys.includes("AbortControllerImpl") ? dataDescriptor(options, "AbortControllerImpl", "Source HEAD options").value : DEFAULT_ABORT_CONTROLLER;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_SOURCE_HEAD_TIMEOUT_MS) throw new RangeError("Source HEAD timeout is invalid");
  if (typeof setTimeoutImpl !== "function" || typeof clearTimeoutImpl !== "function" || typeof AbortControllerImpl !== "function") throw new TypeError("Source HEAD collaborators must be functions");
  return Object.freeze({ timeoutMs, setTimeoutImpl, clearTimeoutImpl, AbortControllerImpl });
}

export function snapshotPerSourceQualificationOptions(options) {
  if (options === undefined) return Object.freeze({ headTimeoutOptions: undefined });
  const keys = plainOptionObject(options, ["headTimeoutOptions"], "Per-source qualification options");
  const headTimeoutOptions = keys.includes("headTimeoutOptions") ? dataDescriptor(options, "headTimeoutOptions", "Per-source qualification options").value : undefined;
  return Object.freeze({ headTimeoutOptions });
}

export function snapshotSourceQualificationOptions(options) {
  if (options === undefined) return Object.freeze({ ids: Object.freeze([]) });
  const keys = plainOptionObject(options, ["ids", "fetchImpl", "headTimeoutOptions"], "Source qualification options");
  const ids = keys.includes("ids") ? dataDescriptor(options, "ids", "Source qualification options").value : [];
  const fetchImpl = keys.includes("fetchImpl") ? dataDescriptor(options, "fetchImpl", "Source qualification options").value : undefined;
  const headTimeoutOptions = keys.includes("headTimeoutOptions") ? dataDescriptor(options, "headTimeoutOptions", "Source qualification options").value : undefined;
  if (fetchImpl !== undefined && typeof fetchImpl !== "function") throw new TypeError("Source qualification fetchImpl must be a function");
  return Object.freeze({ ids: snapshotSourceQualificationIds(ids), fetchImpl, headTimeoutOptions });
}
