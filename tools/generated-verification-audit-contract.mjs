import { snapshotGeneratedVerificationAuditPath } from "./generated-verification-audit-io.mjs";
import {
  GENERATED_VERIFICATION_AUDIT_LIMITS,
  assertGeneratedVerificationAuditSourceByteCeiling
} from "./generated-verification-audit-limits.mjs";

const MAX_CONTRACT_SOURCE_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxSourceBytes;
const MAX_CONTRACT_ENTRIES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxContractEntries;
const AUDIT_ENTRY_KEYS = Object.freeze(["path", "maxBytes"]);

function compareCodeUnits(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function assertAuditByteCeiling(maxBytes) {
  try {
    const admitted = assertGeneratedVerificationAuditSourceByteCeiling(maxBytes);
    if (admitted > MAX_CONTRACT_SOURCE_BYTES) throw new Error("limit mismatch");
    return admitted;
  } catch {
    throw new Error("generated-verification audit contract byte ceiling is invalid");
  }
}

function snapshotFrozenGeneratedVerificationAuditEntry(entry) {
  if (
    entry === null ||
    typeof entry !== "object" ||
    Array.isArray(entry) ||
    Object.getPrototypeOf(entry) !== Object.prototype ||
    !Object.isFrozen(entry)
  ) {
    throw new Error("generated-verification audit contract entry must be an exact frozen plain object");
  }
  const keys = Reflect.ownKeys(entry);
  if (
    keys.length !== AUDIT_ENTRY_KEYS.length ||
    keys.some((key) => typeof key !== "string" || !AUDIT_ENTRY_KEYS.includes(key))
  ) {
    throw new Error("generated-verification audit contract entry must contain exactly path and maxBytes");
  }
  const values = Object.create(null);
  for (const key of AUDIT_ENTRY_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(entry, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification audit contract entry ${key} must be an own data property`);
    }
    values[key] = descriptor.value;
  }
  const canonical = snapshotGeneratedVerificationAuditPath(values.path);
  const maxBytes = assertAuditByteCeiling(values.maxBytes);
  return Object.freeze({ path: canonical.path, maxBytes });
}

function snapshotGeneratedVerificationAuditInventory(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("generated-verification audit contract inventory must be an array");
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(entries, "length");
  const length = lengthDescriptor?.value;
  if (
    !lengthDescriptor ||
    !("value" in lengthDescriptor) ||
    !Number.isSafeInteger(length) ||
    length <= 0 ||
    length > MAX_CONTRACT_ENTRIES
  ) {
    throw new Error("generated-verification audit contract inventory is invalid");
  }
  const expectedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
  const keys = Reflect.ownKeys(entries);
  if (
    keys.length !== expectedKeys.size ||
    keys.some((key) => typeof key !== "string" || !expectedKeys.has(key))
  ) {
    throw new Error("generated-verification audit contract inventory must be a dense exact array");
  }
  const snapshot = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(entries, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification audit contract inventory index ${index} must be an own data property`);
    }
    snapshot.push(descriptor.value);
  }
  return snapshot;
}

export function freezeGeneratedVerificationAuditEntry(path, maxBytes) {
  const canonical = snapshotGeneratedVerificationAuditPath(path);
  return Object.freeze({ path: canonical.path, maxBytes: assertAuditByteCeiling(maxBytes) });
}

export function freezeGeneratedVerificationAuditEntries(entries) {
  const snapshotEntries = snapshotGeneratedVerificationAuditInventory(entries);
  const seen = new Set();
  const frozen = [];
  for (const entry of snapshotEntries) {
    const snapshot = snapshotFrozenGeneratedVerificationAuditEntry(entry);
    if (seen.has(snapshot.path)) throw new Error(`duplicate generated-verification audit contract path: ${snapshot.path}`);
    seen.add(snapshot.path);
    frozen.push(snapshot);
  }
  frozen.sort((left, right) => compareCodeUnits(left.path, right.path));
  return Object.freeze(frozen);
}

export const GENERATED_VERIFICATION_GUIDANCE_CONTRACT = freezeGeneratedVerificationAuditEntry(
  "docs/GENERATED_VERIFICATION_RESULT_QUALIFICATION.md",
  GENERATED_VERIFICATION_AUDIT_LIMITS.maxGuidanceSourceBytes
);

const PRIVACY_SOURCE_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacySourceBytes;
export const GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT = freezeGeneratedVerificationAuditEntries([
  freezeGeneratedVerificationAuditEntry("tools/build-output-verify.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-pass.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-contract-consistency-audit.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-result-contract-audit.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-audit-io.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-audit-contract.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-audit-limits.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-audit-source-result.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-qualification-guidance-audit.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-audit-preflight-hardening-audit.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-preflight-audit.mjs", PRIVACY_SOURCE_MAX_BYTES),
  freezeGeneratedVerificationAuditEntry("tools/generated-verification-privacy-result.mjs", PRIVACY_SOURCE_MAX_BYTES)
]);

export const GENERATED_VERIFICATION_PRIVACY_MAX_AGGREGATE_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyAggregateBytes;
