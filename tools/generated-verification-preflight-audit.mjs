import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { auditGeneratedVerificationAuditPreflightHardening } from "./generated-verification-audit-preflight-hardening-audit.mjs";
import { auditGeneratedVerificationHardening } from "./generated-verification-hardening-audit.mjs";
import { auditGeneratedVerificationPrivacySurface } from "./generated-verification-privacy-surface-audit.mjs";
import { auditGeneratedVerificationQualificationGuidance } from "./generated-verification-qualification-guidance-audit.mjs";
import { auditGeneratedVerificationResultContract } from "./generated-verification-result-contract-audit.mjs";

const MAX_PREFLIGHT_MARKER_BYTES = 512;
const AUDIT_PREFLIGHT_HARDENING_MARKER = "canonical M1261 generated verification audit/preflight hardening integrated";
const HARDENING_MARKER = "canonical M1152-M1158 generated verification boundaries verified";
const RESULT_CONTRACT_MARKER = "canonical M1238-M1239 generated verification result contracts verified";
const QUALIFICATION_GUIDANCE_MARKER = "canonical M1243 generated verification qualification guidance verified";
const PRIVACY_SURFACE_MARKER = "canonical M1244 generated verification privacy surface verified";
const MARKER_CONTROL_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;
const PREFLIGHT_INPUT_KEYS = Object.freeze(["hardeningMarker", "resultContractMarker", "qualificationGuidanceMarker", "privacySurfaceMarker"]);
const PREFLIGHT_RESULT_KEYS = Object.freeze([
  "hardeningMarker",
  "resultContractMarker",
  "qualificationGuidanceMarker",
  "privacySurfaceMarker",
  "marker",
  "extendedMarker",
  "resultShapeMarker"
]);
const PREFLIGHT_RESULT_MARKERS = Object.freeze({
  marker: "canonical generated verification preflight boundaries joined through M1240",
  extendedMarker: "canonical generated verification qualification/privacy preflight boundaries joined through M1249",
  resultShapeMarker: "canonical M1251 generated verification preflight result contract verified"
});
const PREFLIGHT_CHILD_RESULT_KEYS = Object.freeze({
  auditPreflightHardening: Object.freeze(["marker"]),
  hardening: Object.freeze([
    "marker",
    "extensionMarker",
    "traversalMarker",
    "identityMarker",
    "passBindingMarker",
    "metadataMarker",
    "allowlistMarker",
    "subtreeMarker",
    "finalMarker",
    "structuralMarker"
  ]),
  resultContract: Object.freeze(["marker"]),
  qualificationGuidance: Object.freeze(["guide", "marker"]),
  privacySurface: Object.freeze(["files", "aggregateBytes", "marker"])
});

function assertPreflightMarker(value, label) {
  if (typeof value !== "string" || value.length === 0 || Buffer.byteLength(value, "utf8") > MAX_PREFLIGHT_MARKER_BYTES) throw new Error(`${label} must be non-empty bounded preflight marker text`);
  if (!value.isWellFormed()) throw new Error(`${label} must be well-formed Unicode`);
  if (value.normalize("NFC") !== value) throw new Error(`${label} must use NFC Unicode`);
  if (MARKER_CONTROL_TEXT.test(value)) throw new Error(`${label} contains forbidden control text`);
  return value;
}

function assertCanonicalPreflightChildMarker(value, expected, label) {
  if (value !== expected) throw new Error(`generated verification ${label} child marker is not canonical`);
  return value;
}

function assertExactFrozenPreflightResult(result) {
  if (!Object.isFrozen(result) || Object.getPrototypeOf(result) !== Object.prototype) {
    throw new Error("generated verification preflight result must be a frozen plain object");
  }
  const keys = Reflect.ownKeys(result);
  if (keys.length !== PREFLIGHT_RESULT_KEYS.length || keys.some((key) => typeof key !== "string" || !PREFLIGHT_RESULT_KEYS.includes(key))) {
    throw new Error("generated verification preflight result must contain exactly the reviewed fields");
  }
  for (const key of PREFLIGHT_RESULT_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(result, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated verification preflight result ${key} must be an own data property`);
    }
  }
  return result;
}

export function snapshotGeneratedVerificationPreflightChildMarker(candidate, label, expectedKeys = PREFLIGHT_CHILD_RESULT_KEYS.auditPreflightHardening) {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate) ||
    Object.getPrototypeOf(candidate) !== Object.prototype ||
    !Object.isFrozen(candidate)
  ) throw new Error(`${label} child audit result must be a frozen plain object`);
  const keys = Reflect.ownKeys(candidate);
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key) => typeof key !== "string" || !expectedKeys.includes(key))
  ) throw new Error(`${label} child audit result must contain exactly the reviewed fields`);
  const descriptor = Object.getOwnPropertyDescriptor(candidate, "marker");
  if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`${label} child audit marker must be an own data property`);
  return assertPreflightMarker(descriptor.value, label);
}

export function snapshotGeneratedVerificationPreflightInput(candidate) {
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Object.prototype) throw new Error("generated verification preflight input must be a plain object");
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== PREFLIGHT_INPUT_KEYS.length || keys.some((key) => typeof key !== "string" || !PREFLIGHT_INPUT_KEYS.includes(key))) throw new Error("generated verification preflight input must contain exactly the reviewed marker fields");
  const snapshot = Object.create(null);
  for (const key of PREFLIGHT_INPUT_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) throw new Error(`generated verification preflight input ${key} must be an own data property`);
    snapshot[key] = descriptor.value;
  }
  return Object.freeze(snapshot);
}

export function freezeGeneratedVerificationPreflightInput(candidate) {
  const snapshot = snapshotGeneratedVerificationPreflightInput(candidate);
  return Object.freeze({
    hardeningMarker: assertCanonicalPreflightChildMarker(
      assertPreflightMarker(snapshot.hardeningMarker, "hardeningMarker"),
      HARDENING_MARKER,
      "hardening"
    ),
    resultContractMarker: assertCanonicalPreflightChildMarker(
      assertPreflightMarker(snapshot.resultContractMarker, "resultContractMarker"),
      RESULT_CONTRACT_MARKER,
      "result-contract"
    ),
    qualificationGuidanceMarker: assertCanonicalPreflightChildMarker(
      assertPreflightMarker(snapshot.qualificationGuidanceMarker, "qualificationGuidanceMarker"),
      QUALIFICATION_GUIDANCE_MARKER,
      "qualification-guidance"
    ),
    privacySurfaceMarker: assertCanonicalPreflightChildMarker(
      assertPreflightMarker(snapshot.privacySurfaceMarker, "privacySurfaceMarker"),
      PRIVACY_SURFACE_MARKER,
      "privacy-surface"
    )
  });
}

export function freezeGeneratedVerificationPreflightResult(candidate) {
  const input = freezeGeneratedVerificationPreflightInput(candidate);
  const result = Object.freeze({
    hardeningMarker: input.hardeningMarker,
    resultContractMarker: input.resultContractMarker,
    qualificationGuidanceMarker: input.qualificationGuidanceMarker,
    privacySurfaceMarker: input.privacySurfaceMarker,
    marker: PREFLIGHT_RESULT_MARKERS.marker,
    extendedMarker: PREFLIGHT_RESULT_MARKERS.extendedMarker,
    resultShapeMarker: PREFLIGHT_RESULT_MARKERS.resultShapeMarker
  });
  return assertExactFrozenPreflightResult(result);
}

export async function auditGeneratedVerificationPreflight(rootDirectory) {
  const root = resolve(rootDirectory);
  const auditPreflightHardening = await auditGeneratedVerificationAuditPreflightHardening(root);
  const auditPreflightHardeningMarker = assertCanonicalPreflightChildMarker(
    snapshotGeneratedVerificationPreflightChildMarker(
      auditPreflightHardening,
      "auditPreflightHardeningMarker",
      PREFLIGHT_CHILD_RESULT_KEYS.auditPreflightHardening
    ),
    AUDIT_PREFLIGHT_HARDENING_MARKER,
    "audit/preflight hardening"
  );
  const hardening = await auditGeneratedVerificationHardening(root);
  const resultContract = await auditGeneratedVerificationResultContract(root);
  const qualificationGuidance = await auditGeneratedVerificationQualificationGuidance(root);
  const privacySurface = await auditGeneratedVerificationPrivacySurface(root);
  const hardeningMarker = assertCanonicalPreflightChildMarker(
    snapshotGeneratedVerificationPreflightChildMarker(hardening, "hardeningMarker", PREFLIGHT_CHILD_RESULT_KEYS.hardening),
    HARDENING_MARKER,
    "hardening"
  );
  const resultContractMarker = assertCanonicalPreflightChildMarker(
    snapshotGeneratedVerificationPreflightChildMarker(resultContract, "resultContractMarker", PREFLIGHT_CHILD_RESULT_KEYS.resultContract),
    RESULT_CONTRACT_MARKER,
    "result-contract"
  );
  const qualificationGuidanceMarker = assertCanonicalPreflightChildMarker(
    snapshotGeneratedVerificationPreflightChildMarker(qualificationGuidance, "qualificationGuidanceMarker", PREFLIGHT_CHILD_RESULT_KEYS.qualificationGuidance),
    QUALIFICATION_GUIDANCE_MARKER,
    "qualification-guidance"
  );
  const privacySurfaceMarker = assertCanonicalPreflightChildMarker(
    snapshotGeneratedVerificationPreflightChildMarker(privacySurface, "privacySurfaceMarker", PREFLIGHT_CHILD_RESULT_KEYS.privacySurface),
    PRIVACY_SURFACE_MARKER,
    "privacy-surface"
  );
  void auditPreflightHardeningMarker;
  const input = freezeGeneratedVerificationPreflightInput({ hardeningMarker, resultContractMarker, qualificationGuidanceMarker, privacySurfaceMarker });
  return freezeGeneratedVerificationPreflightResult(input);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationPreflight(root)
    .then((result) => {
      console.log(`Generated verification preflight audit passed: ${result.hardeningMarker}.`);
      console.log(result.resultContractMarker);
      console.log(result.qualificationGuidanceMarker);
      console.log(result.privacySurfaceMarker);
      console.log(result.marker);
      console.log(result.extendedMarker);
      console.log(result.resultShapeMarker);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
