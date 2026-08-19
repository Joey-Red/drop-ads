import { GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT } from "./generated-verification-audit-contract.mjs";
import { GENERATED_VERIFICATION_AUDIT_LIMITS } from "./generated-verification-audit-limits.mjs";
import { snapshotGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-source-result.mjs";

export const GENERATED_VERIFICATION_PRIVACY_RESULT_MARKER = "canonical M1244 generated verification privacy surface verified";
const PRIVACY_RESULT_KEYS = Object.freeze(["files", "aggregateBytes", "marker"]);

export function freezeGeneratedVerificationPrivacyFileInventory(files) {
  if (!Array.isArray(files)) throw new Error("generated-verification privacy result files must be an array");
  const lengthDescriptor = Object.getOwnPropertyDescriptor(files, "length");
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length !== GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT.length) {
    throw new Error("generated-verification privacy result files do not cover the complete source contract");
  }
  const expectedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
  const keys = Reflect.ownKeys(files);
  if (keys.length !== expectedKeys.size || keys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) {
    throw new Error("generated-verification privacy result files must be a dense exact array");
  }
  const frozen = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(files, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification privacy result file ${index} must be an own data property`);
    }
    const value = descriptor.value;
    const expected = GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT[index].path;
    if (value !== expected) throw new Error(`generated-verification privacy result file order mismatch at index ${index}`);
    frozen.push(value);
  }
  return Object.freeze(frozen);
}

export function snapshotGeneratedVerificationPrivacySourceResults(entries) {
  if (!Array.isArray(entries)) throw new Error("generated-verification privacy source results must be an array");
  const lengthDescriptor = Object.getOwnPropertyDescriptor(entries, "length");
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length !== GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT.length) {
    throw new Error("generated-verification privacy source results do not cover the complete source contract");
  }
  const expectedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
  const keys = Reflect.ownKeys(entries);
  if (keys.length !== expectedKeys.size || keys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) {
    throw new Error("generated-verification privacy source results must be a dense exact array");
  }
  const snapshots = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(entries, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification privacy source result index ${index} must be an own data property`);
    }
    const snapshot = snapshotGeneratedVerificationAuditSourceResult(descriptor.value, `generated-verification privacy source result ${index}`);
    if (snapshot.path !== GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT[index].path) {
      throw new Error(`generated-verification privacy source result order mismatch at index ${index}`);
    }
    snapshots.push(snapshot);
  }
  return Object.freeze(snapshots);
}

function assertPrivacyAggregateBytes(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyAggregateBytes
  ) {
    throw new Error("generated-verification privacy result aggregate byte count is invalid");
  }
  return value;
}

export function freezeGeneratedVerificationPrivacyResult(files, aggregateBytes) {
  return Object.freeze({
    files: freezeGeneratedVerificationPrivacyFileInventory(files),
    aggregateBytes: assertPrivacyAggregateBytes(aggregateBytes),
    marker: GENERATED_VERIFICATION_PRIVACY_RESULT_MARKER
  });
}

export function freezeGeneratedVerificationPrivacyResultFromSourceResults(entries) {
  const snapshots = snapshotGeneratedVerificationPrivacySourceResults(entries);
  let aggregateBytes = 0;
  const files = [];
  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    aggregateBytes += snapshot.bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyAggregateBytes) {
      throw new Error("generated-verification privacy source results exceed aggregate byte ceiling");
    }
    files.push(snapshot.path);
  }
  return freezeGeneratedVerificationPrivacyResult(files, aggregateBytes);
}

export function snapshotGeneratedVerificationPrivacyResult(candidate) {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate) ||
    Object.getPrototypeOf(candidate) !== Object.prototype ||
    !Object.isFrozen(candidate)
  ) {
    throw new Error("generated-verification privacy result must be a frozen plain object");
  }
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== PRIVACY_RESULT_KEYS.length || keys.some((key) => typeof key !== "string" || !PRIVACY_RESULT_KEYS.includes(key))) {
    throw new Error("generated-verification privacy result must contain exactly files, aggregateBytes, and marker");
  }
  const values = Object.create(null);
  for (const key of PRIVACY_RESULT_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification privacy result ${key} must be an own data property`);
    }
    values[key] = descriptor.value;
  }
  if (values.marker !== GENERATED_VERIFICATION_PRIVACY_RESULT_MARKER) {
    throw new Error("generated-verification privacy result marker is not canonical");
  }
  return freezeGeneratedVerificationPrivacyResult(values.files, values.aggregateBytes);
}
