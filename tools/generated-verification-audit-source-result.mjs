import { freezeGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-io.mjs";

const AUDIT_SOURCE_RESULT_KEYS = Object.freeze(["path", "source", "bytes"]);

export function snapshotGeneratedVerificationAuditSourceResult(candidate, label = "generated-verification audit source result") {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate) ||
    Object.getPrototypeOf(candidate) !== Object.prototype ||
    !Object.isFrozen(candidate)
  ) {
    throw new Error(`${label} must be a frozen plain object`);
  }
  const keys = Reflect.ownKeys(candidate);
  if (
    keys.length !== AUDIT_SOURCE_RESULT_KEYS.length ||
    keys.some((key) => typeof key !== "string" || !AUDIT_SOURCE_RESULT_KEYS.includes(key))
  ) {
    throw new Error(`${label} must contain exactly path, source, and bytes`);
  }
  const values = Object.create(null);
  for (const key of AUDIT_SOURCE_RESULT_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`${label} ${key} must be an own data property`);
    }
    values[key] = descriptor.value;
  }
  return freezeGeneratedVerificationAuditSourceResult(values.path, values.source, values.bytes);
}
