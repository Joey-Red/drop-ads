import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { QUALIFICATION_OBSERVATION_HARDENING_LIMITS } from "./qualification-observation-hardening-contract.mjs";
import {
  QUALIFICATION_OBSERVATION_PRIVACY_MATCHER_COUNT,
  QUALIFICATION_OBSERVATION_PRIVACY_MARKERS,
  QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS
} from "./qualification-observation-privacy-surface-audit.mjs";

const EXPECTED_KEYS = Object.freeze([
  "files", "reviewedSources", "aggregateBytes", "marker", "extendedMarker", "executionMarker", "sourceEvidenceMarker"
]);
const EXPECTED_MARKERS = Object.freeze({
  marker: "canonical M1346 qualification observation privacy surface verified",
  extendedMarker: "canonical M1387 qualification observation privacy matcher integrity verified",
  executionMarker: "canonical M1392 qualification observation dynamic execution/subprocess surfaces refused",
  sourceEvidenceMarker: "canonical M1393 qualification observation complete privacy source evidence verified"
});

function requireFrozenDenseStringArray(candidate, expected, label) {
  if (!Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Array.prototype || !Object.isFrozen(candidate)
    || candidate.length !== expected.length) throw new TypeError(`${label} is not a canonical frozen dense array`);
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== expected.length + 1) throw new TypeError(`${label} has an invalid field set`);
  for (let index = 0; index < expected.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor
      || descriptor.value !== expected[index]) throw new TypeError(`${label}[${index}] is not canonical`);
  }
}

function requireFrozenMarkerObject(candidate) {
  if (!candidate || typeof candidate !== "object" || Object.getPrototypeOf(candidate) !== Object.prototype
    || !Object.isFrozen(candidate)) throw new TypeError("qualification observation privacy markers are not frozen plain data");
  const expectedKeys = Object.keys(EXPECTED_MARKERS);
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== expectedKeys.length) throw new TypeError("qualification observation privacy marker field set is invalid");
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor
      || descriptor.value !== EXPECTED_MARKERS[key]) throw new TypeError(`qualification observation privacy marker ${key} is not canonical`);
  }
}

export const QUALIFICATION_OBSERVATION_PRIVACY_CONTRACT_AUDIT_MARKER =
  "canonical M1422 qualification observation privacy result contract verified";

export function auditQualificationObservationPrivacyContract() {
  requireFrozenDenseStringArray(QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS, EXPECTED_KEYS,
    "qualification observation privacy result keys");
  requireFrozenMarkerObject(QUALIFICATION_OBSERVATION_PRIVACY_MARKERS);
  if (QUALIFICATION_OBSERVATION_PRIVACY_MATCHER_COUNT !== 24
    || QUALIFICATION_OBSERVATION_PRIVACY_MATCHER_COUNT > QUALIFICATION_OBSERVATION_HARDENING_LIMITS.privacyMatcherCount) {
    throw new TypeError("qualification observation privacy matcher count is not canonical");
  }
  return Object.freeze({
    matcherCount: QUALIFICATION_OBSERVATION_PRIVACY_MATCHER_COUNT,
    marker: QUALIFICATION_OBSERVATION_PRIVACY_CONTRACT_AUDIT_MARKER
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation privacy contract audit accepts no arguments");
    console.log(auditQualificationObservationPrivacyContract().marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
