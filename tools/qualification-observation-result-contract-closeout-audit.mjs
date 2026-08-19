import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_HARDENING_RESULT_KEYS,
  auditQualificationObservationHardening
} from "./qualification-observation-hardening-audit.mjs";
import {
  QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS,
  QUALIFICATION_OBSERVATION_PRIVACY_MARKERS
} from "./qualification-observation-privacy-surface-audit.mjs";
import {
  QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS,
  QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS,
  QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT
} from "./qualification-observation-publication-audit.mjs";

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_CLOSEOUT_MARKER =
  "canonical M1418 qualification observation result-contract integrity closeout verified";

function requireFrozenExactStringArray(candidate, expected, label) {
  if (!Array.isArray(candidate) || !Object.isFrozen(candidate) || candidate.length !== expected.length) {
    throw new TypeError(`${label} is not the canonical frozen result-key array`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (candidate[index] !== expected[index]) throw new TypeError(`${label}[${index}] is not canonical`);
  }
}

function requireHistoricalContractExports() {
  requireFrozenExactStringArray(QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS, [
    "files", "reviewedSources", "aggregateBytes", "marker", "extendedMarker", "executionMarker", "sourceEvidenceMarker"
  ], "qualification observation privacy result keys");
  requireFrozenExactStringArray(QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS, [
    "reviewedSources", "marker", "extendedMarker", "preparationMarker", "identityMarker"
  ], "qualification observation publication result keys");
  if (QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT !== 5) {
    throw new TypeError("qualification observation publication source count is not canonical");
  }
  if (!Object.isFrozen(QUALIFICATION_OBSERVATION_PRIVACY_MARKERS)
    || QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.marker !== "canonical M1346 qualification observation privacy surface verified"
    || QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.extendedMarker !== "canonical M1387 qualification observation privacy matcher integrity verified"
    || QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.executionMarker !== "canonical M1392 qualification observation dynamic execution/subprocess surfaces refused"
    || QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.sourceEvidenceMarker !== "canonical M1393 qualification observation complete privacy source evidence verified") {
    throw new TypeError("qualification observation privacy marker contract is not canonical");
  }
  if (!Object.isFrozen(QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS)
    || QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.marker !== "canonical M1357 qualification observation publication integrity verified"
    || QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.extendedMarker !== "canonical M1367 qualification observation publication/read integrity verified"
    || QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.preparationMarker !== "canonical M1377 qualification observation prepare/publication integrity verified"
    || QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.identityMarker !== "canonical M1386 qualification observation publication identity hardening reconciled") {
    throw new TypeError("qualification observation publication marker contract is not canonical");
  }
}

export async function auditQualificationObservationResultContractCloseout(rootDirectory) {
  requireHistoricalContractExports();
  const result = await auditQualificationObservationHardening(resolve(rootDirectory));
  if (!result || typeof result !== "object" || !Object.isFrozen(result)) {
    throw new TypeError("qualification observation hardening result must remain frozen");
  }
  requireFrozenExactStringArray(
    Object.freeze(Object.keys(result)),
    QUALIFICATION_OBSERVATION_HARDENING_RESULT_KEYS,
    "qualification observation hardening result keys"
  );
  if (!Array.isArray(result.files) || !Object.isFrozen(result.files)
    || result.files.length !== result.reviewedSources || !Number.isSafeInteger(result.aggregateBytes) || result.aggregateBytes < 0) {
    throw new TypeError("qualification observation hardening source evidence is incomplete");
  }
  return Object.freeze({
    marker: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_CLOSEOUT_MARKER,
    hardeningMarker: result.marker,
    reviewedSources: result.reviewedSources,
    aggregateBytes: result.aggregateBytes
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation result-contract closeout audit accepts no arguments");
    const result = await auditQualificationObservationResultContractCloseout(resolve(import.meta.dirname, ".."));
    console.log(result.marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
