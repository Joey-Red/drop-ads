const INJECTED_RESPONSE_KEYS = Object.freeze(["ok", "redirected", "headers"]);
const INJECTED_HEADERS_KEYS = Object.freeze(["get"]);

function prototypeOf(value, label) {
  try { return Object.getPrototypeOf(value); }
  catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
}

function exactPlainDataSnapshot(value, keys, label) {
  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch { throw new TypeError(`${label} is not safely inspectable`); }
  if (!value || typeof value !== "object" || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  if (ownKeys.length !== keys.length || ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))) {
    throw new TypeError(`${label} fields are invalid`);
  }
  const snapshot = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label}.${key} must be an enumerable data field`);
    }
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function nativeAccessorValue(object, NativeConstructor, key, label) {
  const descriptor = Object.getOwnPropertyDescriptor(NativeConstructor.prototype, key);
  if (!descriptor || typeof descriptor.get !== "function") throw new TypeError(`${label}.${key} native accessor is unavailable`);
  try { return Reflect.apply(descriptor.get, object, []); }
  catch { throw new TypeError(`${label}.${key} native accessor rejected the receiver`); }
}

function responseSnapshot(response) {
  const NativeResponse = globalThis.Response;
  if (typeof NativeResponse === "function" && prototypeOf(response, "HEAD response") === NativeResponse.prototype) {
    return Object.freeze({
      ok: nativeAccessorValue(response, NativeResponse, "ok", "HEAD response"),
      redirected: nativeAccessorValue(response, NativeResponse, "redirected", "HEAD response"),
      headers: nativeAccessorValue(response, NativeResponse, "headers", "HEAD response")
    });
  }
  return Object.freeze(exactPlainDataSnapshot(response, INJECTED_RESPONSE_KEYS, "HEAD response"));
}

function headersGet(headers) {
  const NativeHeaders = globalThis.Headers;
  if (typeof NativeHeaders === "function" && prototypeOf(headers, "HEAD response.headers") === NativeHeaders.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(NativeHeaders.prototype, "get");
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "function") return null;
    return (...args) => Reflect.apply(descriptor.value, headers, args);
  }
  const snapshot = exactPlainDataSnapshot(headers, INJECTED_HEADERS_KEYS, "HEAD response.headers");
  return typeof snapshot.get === "function" ? (...args) => Reflect.apply(snapshot.get, headers, args) : null;
}

export function parseDiagnosticContentLength(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string" || !/^(0|[1-9][0-9]{0,15})$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function snapshotHeadResponseMetadata(response) {
  try {
    if (!response || (typeof response !== "object" && typeof response !== "function")) return null;
    const snapshot = responseSnapshot(response);
    if (snapshot.ok !== true || snapshot.redirected !== false || !snapshot.headers || (typeof snapshot.headers !== "object" && typeof snapshot.headers !== "function")) return null;
    const get = headersGet(snapshot.headers);
    if (!get) return null;
    let raw;
    try { raw = get("content-length"); }
    catch { return null; }
    return Object.freeze({ declaredBytes: parseDiagnosticContentLength(raw) });
  } catch {
    return null;
  }
}
