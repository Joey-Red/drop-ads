function safeArrayKind(value) {
  try {
    return { safe: true, isArray: Array.isArray(value) };
  } catch {
    return { safe: false, isArray: false };
  }
}

export function readPlainDataField(value, key) {
  if (!value || typeof value !== "object") {
    return { safe: false, present: false, value: undefined };
  }
  const arrayKind = safeArrayKind(value);
  if (!arrayKind.safe || arrayKind.isArray) {
    return { safe: false, present: false, value: undefined };
  }
  let prototype;
  let descriptor;
  try {
    prototype = Object.getPrototypeOf(value);
    descriptor = Object.getOwnPropertyDescriptor(value, key);
  } catch {
    return { safe: false, present: false, value: undefined };
  }
  if (prototype !== Object.prototype && prototype !== null) {
    return { safe: false, present: false, value: undefined };
  }
  if (!descriptor) return { safe: true, present: false, value: undefined };
  if (!descriptor.enumerable || !("value" in descriptor)) {
    return { safe: false, present: true, value: undefined };
  }
  return { safe: true, present: true, value: descriptor.value };
}

export function assertPlainExactObject(value, label, allowedKeys) {
  if (!value || typeof value !== "object") {
    throw new TypeError(`${label} must be a plain object`);
  }
  const arrayKind = safeArrayKind(value);
  if (!arrayKind.safe) {
    throw new TypeError(`${label} must be a plain object with inspectable fields`);
  }
  if (arrayKind.isArray) {
    throw new TypeError(`${label} must be a plain object`);
  }

  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} must be a plain object with inspectable fields`);
  }
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }

  const allowed = allowedKeys instanceof Set ? allowedKeys : new Set(allowedKeys);
  if (ownKeys.some((key) => typeof key === "symbol")) {
    throw new Error(`${label} contains an unsupported symbol field`);
  }

  const stringKeys = ownKeys.filter((key) => typeof key === "string");
  const unexpected = stringKeys.filter((key) => !allowed.has(key)).sort();
  if (unexpected.length) throw new Error(`${label} contains unknown or unsupported field: ${unexpected[0]}`);

  for (const key of [...stringKeys].sort()) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new Error(`${label}.${key} must be an inspectable enumerable data field`); }
    if (!descriptor?.enumerable) throw new Error(`${label}.${key} must be an enumerable data field`);
    if (!("value" in descriptor)) throw new Error(`${label}.${key} must be a data field`);
  }
  return value;
}

function isCanonicalArrayIndexKey(key, length) {
  if (typeof key !== "string" || key === "length") return key === "length";
  if (!/^(?:0|[1-9]\d*)$/.test(key)) return false;
  const index = Number(key);
  return Number.isSafeInteger(index) && index >= 0 && index < length && String(index) === key;
}

export function snapshotDenseDataArray(value, label, maxLength) {
  if (!Number.isSafeInteger(maxLength) || maxLength < 0) {
    throw new TypeError(`${label} maximum length must be a non-negative safe integer`);
  }
  const arrayKind = safeArrayKind(value);
  if (!arrayKind.safe) throw new TypeError(`${label} must be a normal dense array`);
  if (!arrayKind.isArray) throw new TypeError(`${label} must be an array`);

  let prototype;
  let lengthDescriptor;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    ownKeys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} must be a normal dense array`);
  }
  if (prototype !== Array.prototype) throw new TypeError(`${label} must be a normal dense array`);

  if (!("value" in (lengthDescriptor ?? {})) || !Number.isSafeInteger(lengthDescriptor.value)
    || lengthDescriptor.value < 0 || lengthDescriptor.value > maxLength) {
    throw new Error(`${label} length must be at most ${maxLength}`);
  }
  const length = lengthDescriptor.value;

  // Reject sparse/extra-property arrays before allocating a detached result proportional
  // to the declared length. Preserve the historical "enumerable data entries" diagnostic
  // while also naming the stronger dense-index invariant so older callers and newer
  // hardening checks observe the same fail-closed condition.
  if (ownKeys.length !== length + 1) {
    throw new Error(`${label} must contain only dense array indices and enumerable data entries`);
  }
  for (const key of ownKeys) {
    if (typeof key === "symbol") throw new Error(`${label} cannot contain symbol properties`);
    if (!isCanonicalArrayIndexKey(key, length)) {
      throw new Error(`${label} must contain only dense array indices and enumerable data entries`);
    }
  }

  const snapshot = new Array(length);
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label} must be a normal dense array`); }
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw new Error(`${label} must contain only enumerable data entries`);
    }
    snapshot[index] = descriptor.value;
  }
  return snapshot;
}
