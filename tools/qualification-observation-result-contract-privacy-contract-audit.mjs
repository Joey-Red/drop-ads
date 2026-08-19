import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_AGGREGATE_BYTES,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_SOURCE_BYTES,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS
} from "./qualification-observation-result-contract-privacy-contract.mjs";
import {
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MARKER,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MATCHER_COUNT,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_RESULT_KEYS
} from "./qualification-observation-result-contract-privacy-surface-audit.mjs";

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_CONTRACT_MARKER =
  "canonical M1434 qualification observation result-contract privacy audit contract verified";

function requireFrozenExactStringArray(candidate, expected, label) {
  if (!Array.isArray(candidate) || !Object.isFrozen(candidate) || candidate.length !== expected.length) {
    throw new TypeError(`${label} is not the canonical frozen array`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, String(index));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable || descriptor.value !== expected[index]) {
      throw new TypeError(`${label}[${index}] is not canonical`);
    }
  }
}

export function auditQualificationObservationResultContractPrivacyContract() {
  if (!Object.isFrozen(QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS)
    || QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS.sourceBytes !== 64 * 1024
    || QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS.sourceCount !== 5
    || QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS.aggregateBytes !== 5 * 64 * 1024
    || QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_SOURCE_BYTES !== 64 * 1024
    || QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_AGGREGATE_BYTES !== 5 * 64 * 1024) {
    throw new TypeError("qualification observation result-contract privacy limits are not canonical");
  }
  requireFrozenExactStringArray(QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS, [
    "tools/qualification-observation-result-contract-closeout-audit.mjs",
    "tools/qualification-observation-privacy-contract-audit.mjs",
    "tools/qualification-observation-publication-contract-audit.mjs",
    "tools/qualification-observation-hardening-result-contract-audit.mjs",
    "tools/qualification-observation-result-contract-integration-audit.mjs"
  ], "qualification observation result-contract privacy source paths");
  requireFrozenExactStringArray(QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_RESULT_KEYS, [
    "files", "reviewedSources", "aggregateBytes", "marker"
  ], "qualification observation result-contract privacy result keys");
  if (QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MATCHER_COUNT !== 20) {
    throw new TypeError("qualification observation result-contract privacy matcher count is not canonical");
  }
  if (QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MARKER
    !== "canonical M1427 qualification observation result contract privacy surface verified") {
    throw new TypeError("qualification observation result-contract privacy historical marker is not canonical");
  }
  return Object.freeze({ marker: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_CONTRACT_MARKER });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation result-contract privacy contract audit accepts no arguments");
    console.log(auditQualificationObservationResultContractPrivacyContract().marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
