const MAX_RESET_ERROR_CHARS = 1_024;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function ownData(value, key) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && "value" in descriptor && descriptor.enumerable
      ? { present: true, value: descriptor.value }
      : { present: false, value: undefined };
  } catch {
    return { present: false, value: undefined };
  }
}

function exactPlainObject(value, keys, label) {
  let prototype;
  let ownKeys;
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError();
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} must be a plain own-data object`);
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain own-data object`);
  if (ownKeys.length !== keys.length || ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))) {
    throw new TypeError(`${label} has unexpected fields`);
  }
  for (const key of keys) if (!ownData(value, key).present) throw new TypeError(`${label}.${key} must be an enumerable own data field`);
  return value;
}

function safeErrorText(value) {
  return typeof value === "string"
    && value.length > 0
    && value.length <= MAX_RESET_ERROR_CHARS
    && !CONTROL_CHARACTERS.test(value);
}

export function unwrapSettingsResetResponse(response, fallback = "Could not reset configured settings") {
  if (!safeErrorText(fallback)) throw new TypeError("Settings reset fallback is invalid");
  const okField = ownData(response, "ok");
  const expectedKeys = okField.present && okField.value === true ? ["ok", "result"] : ["ok", "error"];
  exactPlainObject(response, expectedKeys, "Settings reset response");
  const ok = ownData(response, "ok").value;
  if (typeof ok !== "boolean") throw new TypeError("Settings reset response.ok must be boolean");
  if (!ok) {
    const error = ownData(response, "error").value;
    throw new Error(safeErrorText(error) ? error : fallback);
  }

  const result = ownData(response, "result").value;
  exactPlainObject(result, ["changed"], "Settings reset result");
  if (ownData(result, "changed").value !== true) throw new TypeError("Settings reset result.changed must be true");
  return Object.freeze({ changed: true });
}
