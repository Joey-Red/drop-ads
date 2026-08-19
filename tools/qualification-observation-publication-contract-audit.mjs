import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS,
  QUALIFICATION_OBSERVATION_PUBLICATION_PATHS,
  QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS,
  QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT
} from "./qualification-observation-publication-audit.mjs";

const EXPECTED_PATHS = Object.freeze([
  "tools/qualification-observation-path.mjs",
  "tools/qualification-observation-io.mjs",
  "tools/qualification-observation-lock.mjs",
  "tools/qualification-file-io.mjs",
  "tools/qualification-observation-prepare.mjs"
]);
const EXPECTED_RESULT_KEYS = Object.freeze([
  "reviewedSources", "marker", "extendedMarker", "preparationMarker", "identityMarker"
]);
const EXPECTED_MARKERS = Object.freeze({
  marker: "canonical M1357 qualification observation publication integrity verified",
  extendedMarker: "canonical M1367 qualification observation publication/read integrity verified",
  preparationMarker: "canonical M1377 qualification observation prepare/publication integrity verified",
  identityMarker: "canonical M1386 qualification observation publication identity hardening reconciled"
});

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

function requireFrozenExactMarkers(candidate) {
  if (!candidate || typeof candidate !== "object" || Object.getPrototypeOf(candidate) !== Object.prototype
    || !Object.isFrozen(candidate)) throw new TypeError("qualification observation publication markers are not frozen plain data");
  const expectedKeys = Object.keys(EXPECTED_MARKERS);
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== expectedKeys.length) throw new TypeError("qualification observation publication marker field set is invalid");
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor
      || descriptor.value !== EXPECTED_MARKERS[key]) throw new TypeError(`qualification observation publication marker ${key} is not canonical`);
  }
}

export const QUALIFICATION_OBSERVATION_PUBLICATION_CONTRACT_AUDIT_MARKER =
  "canonical M1423 qualification observation publication result contract verified";

export function auditQualificationObservationPublicationContract() {
  requireFrozenDenseExactArray(QUALIFICATION_OBSERVATION_PUBLICATION_PATHS, EXPECTED_PATHS,
    "qualification observation publication paths");
  requireFrozenDenseExactArray(QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS, EXPECTED_RESULT_KEYS,
    "qualification observation publication result keys");
  requireFrozenExactMarkers(QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS);
  if (QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT !== EXPECTED_PATHS.length) {
    throw new TypeError("qualification observation publication source count is not canonical");
  }
  return Object.freeze({
    reviewedSources: QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT,
    marker: QUALIFICATION_OBSERVATION_PUBLICATION_CONTRACT_AUDIT_MARKER
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation publication contract audit accepts no arguments");
    console.log(auditQualificationObservationPublicationContract().marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
