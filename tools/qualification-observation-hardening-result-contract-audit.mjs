import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_HARDENING_LIMITS,
  QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES,
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT,
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS
} from "./qualification-observation-hardening-contract.mjs";
import { QUALIFICATION_OBSERVATION_HARDENING_RESULT_KEYS } from "./qualification-observation-hardening-audit.mjs";

const EXPECTED_RESULT_KEYS = Object.freeze([
  "files", "reviewedSources", "aggregateBytes",
  "privacyMarker", "privacyMatcherMarker", "privacyExecutionMarker", "privacySourceEvidenceMarker",
  "publicationIntegrityMarker", "publicationReadMarker", "preparationPublicationMarker", "publicationIdentityMarker",
  "marker", "extendedMarker", "publicationMarker", "dependencyMarker", "preparationReadMarker", "closeoutMarker",
  "identityJsonMarker", "trancheCloseoutMarker", "privacyResultMarker", "publicationResultMarker", "writerReadbackMarker",
  "sourceContractMarker", "finalCloseoutMarker", "contractIntegrationMarker"
]);

function requireFrozenDenseExactArray(candidate, expected, label) {
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

function requireSourceContract() {
  if (!Object.isFrozen(QUALIFICATION_OBSERVATION_HARDENING_LIMITS)
    || QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceCount !== 9
    || QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceBytes !== 256 * 1024
    || QUALIFICATION_OBSERVATION_HARDENING_LIMITS.aggregateBytes !== 9 * 256 * 1024
    || QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES !== QUALIFICATION_OBSERVATION_HARDENING_LIMITS.aggregateBytes) {
    throw new TypeError("qualification observation hardening limits are not canonical");
  }
  requireFrozenDenseExactArray(
    QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS,
    QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS,
    "qualification observation hardening source paths"
  );
  if (!Array.isArray(QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT)
    || !Object.isFrozen(QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT)
    || QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length !== 9) {
    throw new TypeError("qualification observation hardening source contract is not canonical");
  }
  for (let index = 0; index < 9; index += 1) {
    const entry = QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT[index];
    if (!entry || !Object.isFrozen(entry) || entry.path !== QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[index]
      || entry.maxBytes !== QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceBytes) {
      throw new TypeError(`qualification observation hardening source contract[${index}] is not canonical`);
    }
  }
}

export const QUALIFICATION_OBSERVATION_HARDENING_RESULT_CONTRACT_AUDIT_MARKER =
  "canonical M1424 qualification observation hardening result contract verified";

export function auditQualificationObservationHardeningResultContract() {
  requireFrozenDenseExactArray(QUALIFICATION_OBSERVATION_HARDENING_RESULT_KEYS, EXPECTED_RESULT_KEYS,
    "qualification observation hardening result keys");
  requireSourceContract();
  return Object.freeze({
    reviewedSources: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length,
    resultKeys: QUALIFICATION_OBSERVATION_HARDENING_RESULT_KEYS.length,
    marker: QUALIFICATION_OBSERVATION_HARDENING_RESULT_CONTRACT_AUDIT_MARKER
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation hardening result contract audit accepts no arguments");
    console.log(auditQualificationObservationHardeningResultContract().marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
