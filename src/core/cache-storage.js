export const MAX_PERSISTED_LIST_CACHE_BYTES = 8_000_000;
export const MAX_RAW_LIST_CACHE_ENTRIES = 256;
export const MAX_LIST_CACHE_KEY_CHARS = 96;
export const MAX_LIST_CACHE_JSON_DEPTH = 32;
export const MAX_LIST_CACHE_JSON_NODES = 1_000_000;

export function isCanonicalListCacheKey(value) {
  return typeof value === "string"
    && value.length >= 1
    && value.length <= MAX_LIST_CACHE_KEY_CHARS
    && /^[a-z0-9][a-z0-9._-]{0,95}$/i.test(value);
}

export function assertRawListCacheBound(cache) {
  if (cache == null) return {};
  let isArray;
  try { isArray = Array.isArray(cache); }
  catch { throw new Error("List cache must have an inspectable array kind"); }
  if (typeof cache !== "object" || isArray) throw new Error("List cache must be an object");

  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(cache);
    ownKeys = Reflect.ownKeys(cache);
  } catch {
    throw new Error("List cache must be a plain object with inspectable entries");
  }
  if (prototype !== Object.prototype && prototype !== null) throw new Error("List cache must be a plain object");

  if (ownKeys.some((key) => typeof key === "symbol")) throw new Error("List cache cannot contain symbol keys");
  const keys = ownKeys.filter((key) => typeof key === "string");
  if (keys.length > MAX_RAW_LIST_CACHE_ENTRIES) {
    throw new Error(`List cache contains ${keys.length} entries; raw cache limit is ${MAX_RAW_LIST_CACHE_ENTRIES}`);
  }

  for (const key of keys) {
    if (!isCanonicalListCacheKey(key)) {
      throw new Error(`List cache key must use canonical subscription-id syntax and at most ${MAX_LIST_CACHE_KEY_CHARS} characters`);
    }
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(cache, key); }
    catch { throw new Error("List cache entries must be inspectable enumerable data fields"); }
    if (!descriptor?.enumerable) throw new Error("List cache entries must be enumerable data fields");
    if (!("value" in descriptor)) throw new Error("List cache entries must be data fields");
  }
  return cache;
}

export function snapshotRawListCache(cache) {
  const bounded = assertRawListCacheBound(cache);
  let ownKeys;
  try { ownKeys = Reflect.ownKeys(bounded); }
  catch { throw new Error("List cache must remain inspectable while it is snapshotted"); }

  const snapshot = Object.create(null);
  for (const key of ownKeys) {
    if (typeof key !== "string") throw new Error("List cache cannot contain symbol keys");
    if (!isCanonicalListCacheKey(key)) throw new Error("List cache changed while it was being snapshotted");
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(bounded, key); }
    catch { throw new Error("List cache entries must remain inspectable while snapshotted"); }
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw new Error("List cache entries must remain enumerable data fields while snapshotted");
    }
    snapshot[key] = descriptor.value;
  }
  if (ownKeys.length > MAX_RAW_LIST_CACHE_ENTRIES) {
    throw new Error(`List cache contains ${ownKeys.length} entries; raw cache limit is ${MAX_RAW_LIST_CACHE_ENTRIES}`);
  }
  return snapshot;
}

function snapshotJsonValue(value, label, state, depth) {
  state.nodes += 1;
  if (state.nodes > MAX_LIST_CACHE_JSON_NODES) throw new Error(`List cache JSON data exceeds ${MAX_LIST_CACHE_JSON_NODES} nodes`);
  if (depth > MAX_LIST_CACHE_JSON_DEPTH) throw new Error(`List cache JSON data exceeds depth ${MAX_LIST_CACHE_JSON_DEPTH}`);

  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must contain finite JSON numbers`);
    return value;
  }
  if (typeof value !== "object") throw new Error(`${label} must contain JSON data only`);

  let isArray;
  try { isArray = Array.isArray(value); }
  catch { throw new Error(`${label} must have an inspectable array kind`); }
  if (isArray) {
    let prototype;
    let lengthDescriptor;
    let ownKeys;
    try {
      prototype = Object.getPrototypeOf(value);
      lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
      ownKeys = Reflect.ownKeys(value);
    } catch {
      throw new Error(`${label} must be a normal dense array with inspectable entries`);
    }
    if (prototype !== Array.prototype) throw new Error(`${label} must be a normal dense array`);
    if (!("value" in (lengthDescriptor ?? {})) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) {
      throw new Error(`${label} must be a normal dense array`);
    }
    const length = lengthDescriptor.value;
    if (state.nodes + length > MAX_LIST_CACHE_JSON_NODES) throw new Error(`List cache JSON data exceeds ${MAX_LIST_CACHE_JSON_NODES} nodes`);
    if (ownKeys.some((key) => typeof key === "symbol")) throw new Error(`${label} cannot contain symbol properties`);
    if (ownKeys.length !== length + 1) throw new Error(`${label} must contain only dense array indices`);

    const result = new Array(length);
    for (let index = 0; index < length; index += 1) {
      const key = String(index);
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
      catch { throw new Error(`${label} must contain inspectable enumerable data entries`); }
      if (!descriptor?.enumerable || !("value" in descriptor)) throw new Error(`${label} must contain only enumerable data entries`);
      result[index] = snapshotJsonValue(descriptor.value, `${label}[${index}]`, state, depth + 1);
    }
    return result;
  }

  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    throw new Error(`${label} must contain inspectable plain JSON objects`);
  }
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${label} must contain plain JSON objects`);
  if (ownKeys.some((key) => typeof key === "symbol")) throw new Error(`${label} cannot contain symbol properties`);

  const result = Object.create(null);
  for (const key of ownKeys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new Error(`${label}.${String(key)} must be an inspectable enumerable data field`); }
    if (!descriptor?.enumerable || !("value" in descriptor)) throw new Error(`${label}.${String(key)} must be an enumerable data field`);
    result[key] = snapshotJsonValue(descriptor.value, `${label}.${key}`, state, depth + 1);
  }
  return result;
}

function snapshotListCacheJson(cache) {
  const bounded = snapshotRawListCache(cache);
  const result = Object.create(null);
  const state = { nodes: 0 };
  for (const key of Object.keys(bounded)) {
    result[key] = snapshotJsonValue(bounded[key], `List cache.${key}`, state, 1);
  }
  return result;
}

export function serializedListCacheBytes(cache) {
  const snapshot = snapshotListCacheJson(cache);
  return new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
}

export function assertListCacheStorageBound(cache) {
  const bytes = serializedListCacheBytes(cache);
  if (bytes > MAX_PERSISTED_LIST_CACHE_BYTES) {
    throw new Error(`List cache requires ${bytes} bytes; persisted cache limit is ${MAX_PERSISTED_LIST_CACHE_BYTES} bytes`);
  }
  return bytes;
}
