const MAX_SESSION_RECOVERY_ERROR_CHARS = 1_024;

function ownEnumerableData(value, key) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && descriptor.enumerable && "value" in descriptor
      ? { present: true, value: descriptor.value }
      : { present: false, value: undefined };
  } catch {
    return { present: false, value: undefined };
  }
}

function assertExactPlainObject(value, expectedKeys, label) {
  let prototype;
  let keys;
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError();
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} must be a plain own-data object`);
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain own-data object`);
  if (keys.length !== expectedKeys.length || keys.some((key) => typeof key !== "string" || !expectedKeys.includes(key))) {
    throw new TypeError(`${label} has unexpected fields`);
  }
  for (const key of expectedKeys) {
    if (!ownEnumerableData(value, key).present) throw new TypeError(`${label}.${key} must be an enumerable own data field`);
  }
}

export function unwrapSessionRecoveryResponse(response, expectedDomain, fallback = "Could not resume protection for this site") {
  if (typeof expectedDomain !== "string" || !expectedDomain) throw new TypeError("Session recovery expected domain is invalid");
  if (typeof fallback !== "string" || !fallback || fallback.length > MAX_SESSION_RECOVERY_ERROR_CHARS) {
    throw new TypeError("Session recovery fallback is invalid");
  }

  const okField = ownEnumerableData(response, "ok");
  const expectedResponseKeys = okField.present && okField.value === true ? ["ok", "result"] : ["ok", "error"];
  assertExactPlainObject(response, expectedResponseKeys, "Session recovery response");
  const ok = ownEnumerableData(response, "ok").value;
  if (typeof ok !== "boolean") throw new TypeError("Session recovery response.ok must be boolean");
  if (!ok) {
    const error = ownEnumerableData(response, "error").value;
    throw new Error(typeof error === "string" && error.length > 0 && error.length <= MAX_SESSION_RECOVERY_ERROR_CHARS ? error : fallback);
  }

  const result = ownEnumerableData(response, "result").value;
  assertExactPlainObject(result, ["domain", "paused", "changed"], "Session recovery result");
  const domain = ownEnumerableData(result, "domain").value;
  const paused = ownEnumerableData(result, "paused").value;
  const changed = ownEnumerableData(result, "changed").value;
  if (domain !== expectedDomain) throw new TypeError("Session recovery result domain mismatch");
  if (paused !== false) throw new TypeError("Session recovery result pause state mismatch");
  if (typeof changed !== "boolean") throw new TypeError("Session recovery result.changed must be boolean");
  return Object.freeze({ domain, paused: false, changed });
}
