import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readQualificationUtf8File } from "./qualification-file-io.mjs";
import {
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_AGGREGATE_BYTES,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_SOURCE_BYTES,
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS
} from "./qualification-observation-result-contract-privacy-contract.mjs";

const arrayIsArray = Array.isArray;
const arrayPrototype = Array.prototype;
const arrayPrototypeIncludes = Array.prototype.includes;
const arrayPrototypePush = Array.prototype.push;
const bufferByteLength = Buffer.byteLength;
const objectFreeze = Object.freeze;
const objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const objectGetPrototypeOf = Object.getPrototypeOf;
const objectIsFrozen = Object.isFrozen;
const objectPrototype = Object.prototype;
const reflectApply = Reflect.apply;
const reflectOwnKeys = Reflect.ownKeys;
const regexpPrototype = RegExp.prototype;
const regexpPrototypeTest = RegExp.prototype.test;
const regexpGlobalGetter = Object.getOwnPropertyDescriptor(RegExp.prototype, "global").get;
const regexpStickyGetter = Object.getOwnPropertyDescriptor(RegExp.prototype, "sticky").get;
const regexpFlagsGetter = Object.getOwnPropertyDescriptor(RegExp.prototype, "flags").get;
const regexpSourceGetter = Object.getOwnPropertyDescriptor(RegExp.prototype, "source").get;
const setPrototypeHas = Set.prototype.has;
const setPrototypeAdd = Set.prototype.add;

function capturedArrayIncludes(array, value) {
  return reflectApply(arrayPrototypeIncludes, array, [value]);
}
function capturedArrayPush(array, value) {
  reflectApply(arrayPrototypePush, array, [value]);
}
function capturedSetHas(set, value) {
  return reflectApply(setPrototypeHas, set, [value]);
}
function capturedSetAdd(set, value) {
  reflectApply(setPrototypeAdd, set, [value]);
}
function readRegExpSlot(getter, pattern) {
  return reflectApply(getter, pattern, []);
}

const MAX_MATCHERS = 32;
const MAX_MATCHER_LABEL_BYTES = 64;
const MAX_MATCHER_PATTERN_BYTES = 512;
const RAW_FORBIDDEN = objectFreeze([
  objectFreeze(["fetch", /\bfetch\s*\(/u]),
  objectFreeze(["XMLHttpRequest", /\bXMLHttpRequest\b/u]),
  objectFreeze(["WebSocket", /\bWebSocket\s*\(/u]),
  objectFreeze(["sendBeacon", /\bsendBeacon\s*\(/u]),
  objectFreeze(["browser API", /\bbrowser\s*\./u]),
  objectFreeze(["chrome API", /\bchrome\s*\./u]),
  objectFreeze(["localStorage", /\blocalStorage\b/u]),
  objectFreeze(["sessionStorage", /\bsessionStorage\b/u]),
  objectFreeze(["indexedDB", /\bindexedDB\b/u]),
  objectFreeze(["process environment", /\bprocess\s*\.\s*env\b/u]),
  objectFreeze(["process cwd", /\bprocess\s*\.\s*cwd\s*\(/u]),
  objectFreeze(["host discovery", /\b(?:hostname|userInfo|homedir)\s*\(/u]),
  objectFreeze(["timestamp collection", /\bDate\s*\.\s*now\s*\(|\bnew\s+Date\s*\(/u]),
  objectFreeze(["performance timing", /\bperformance\s*\./u]),
  objectFreeze(["network module", /["'](?:node:)?(?:http|https|net|tls|dns|dgram|undici)["']/u]),
  objectFreeze(["child process module", /["'](?:node:)?child_process["']/u]),
  objectFreeze(["worker threads module", /["'](?:node:)?worker_threads["']/u]),
  objectFreeze(["dynamic import", /\bimport\s*\(/u]),
  objectFreeze(["eval", /\beval\s*\(/u]),
  objectFreeze(["Function constructor", /\b(?:new\s+)?Function\s*\(/u])
]);

function requireFrozenDenseArray(candidate, expectedLength, label) {
  if (!arrayIsArray(candidate) || objectGetPrototypeOf(candidate) !== arrayPrototype
    || !objectIsFrozen(candidate) || candidate.length !== expectedLength) {
    throw new TypeError(`${label} must be a frozen dense array of length ${expectedLength}`);
  }
  const expectedKeys = ["length"];
  for (let index = 0; index < expectedLength; index += 1) capturedArrayPush(expectedKeys, String(index));
  const ownKeys = reflectOwnKeys(candidate);
  if (ownKeys.length !== expectedKeys.length) throw new TypeError(`${label} has an invalid field set`);
  for (let index = 0; index < ownKeys.length; index += 1) {
    const key = ownKeys[index];
    if (typeof key !== "string" || !capturedArrayIncludes(expectedKeys, key)) {
      throw new TypeError(`${label} has an invalid field set`);
    }
  }
}

function snapshotFrozenFileEvidence(candidate, index) {
  if (!candidate || typeof candidate !== "object" || arrayIsArray(candidate) || !objectIsFrozen(candidate)
    || (objectGetPrototypeOf(candidate) !== objectPrototype && objectGetPrototypeOf(candidate) !== null)) {
    throw new TypeError(`qualification observation result-contract privacy files[${index}] must be a frozen plain data object`);
  }
  const ownKeys = reflectOwnKeys(candidate);
  if (ownKeys.length !== 2 || !capturedArrayIncludes(ownKeys, "path") || !capturedArrayIncludes(ownKeys, "bytes")) {
    throw new TypeError(`qualification observation result-contract privacy files[${index}] has an invalid field set`);
  }
  const pathDescriptor = objectGetOwnPropertyDescriptor(candidate, "path");
  const bytesDescriptor = objectGetOwnPropertyDescriptor(candidate, "bytes");
  if (!pathDescriptor || !("value" in pathDescriptor) || !bytesDescriptor || !("value" in bytesDescriptor)
    || !pathDescriptor.enumerable || !bytesDescriptor.enumerable) {
    throw new TypeError(`qualification observation result-contract privacy files[${index}] must contain enumerable own data fields`);
  }
  const path = pathDescriptor.value;
  const bytes = bytesDescriptor.value;
  if (path !== QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS[index]) {
    throw new TypeError(`qualification observation result-contract privacy files[${index}].path is not canonical`);
  }
  if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_SOURCE_BYTES) {
    throw new TypeError(`qualification observation result-contract privacy files[${index}].bytes is invalid`);
  }
  return objectFreeze({ path, bytes });
}

export function snapshotQualificationObservationResultContractPrivacyMatchers(candidate) {
  if (!arrayIsArray(candidate) || candidate.length === 0 || candidate.length > MAX_MATCHERS) {
    throw new TypeError("qualification observation result-contract privacy matcher inventory has invalid cardinality");
  }
  requireFrozenDenseArray(candidate, candidate.length, "qualification observation result-contract privacy matcher inventory");
  const labels = new Set();
  const snapshot = [];
  for (let index = 0; index < candidate.length; index += 1) {
    const outerDescriptor = objectGetOwnPropertyDescriptor(candidate, String(index));
    if (!outerDescriptor || !("value" in outerDescriptor) || "get" in outerDescriptor || "set" in outerDescriptor || !outerDescriptor.enumerable) {
      throw new TypeError(`qualification observation result-contract privacy matcher inventory[${index}] must be an enumerable own data element`);
    }
    const tuple = outerDescriptor.value;
    requireFrozenDenseArray(tuple, 2, `qualification observation result-contract privacy matcher[${index}]`);
    const labelDescriptor = objectGetOwnPropertyDescriptor(tuple, "0");
    const patternDescriptor = objectGetOwnPropertyDescriptor(tuple, "1");
    if (!labelDescriptor || !("value" in labelDescriptor) || !patternDescriptor || !("value" in patternDescriptor)) {
      throw new TypeError(`qualification observation result-contract privacy matcher[${index}] must contain own data fields`);
    }
    const label = labelDescriptor.value;
    const pattern = patternDescriptor.value;
    if (typeof label !== "string" || !label || bufferByteLength(label, "utf8") > MAX_MATCHER_LABEL_BYTES) {
      throw new TypeError(`qualification observation result-contract privacy matcher[${index}] label is invalid`);
    }
    if (!pattern || typeof pattern !== "object" || objectGetPrototypeOf(pattern) !== regexpPrototype) {
      throw new TypeError(`qualification observation result-contract privacy matcher[${index}] pattern is invalid`);
    }
    const global = readRegExpSlot(regexpGlobalGetter, pattern);
    const sticky = readRegExpSlot(regexpStickyGetter, pattern);
    const flags = readRegExpSlot(regexpFlagsGetter, pattern);
    const source = readRegExpSlot(regexpSourceGetter, pattern);
    if (global || sticky || flags !== "u" || bufferByteLength(source, "utf8") > MAX_MATCHER_PATTERN_BYTES) {
      throw new TypeError(`qualification observation result-contract privacy matcher[${index}] pattern is invalid`);
    }
    if (capturedSetHas(labels, label)) {
      throw new TypeError(`qualification observation result-contract privacy matcher label is duplicated: ${label}`);
    }
    capturedSetAdd(labels, label);
    capturedArrayPush(snapshot, objectFreeze([label, pattern]));
  }
  return objectFreeze(snapshot);
}

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MATCHER_COUNT = RAW_FORBIDDEN.length;
const FORBIDDEN = snapshotQualificationObservationResultContractPrivacyMatchers(RAW_FORBIDDEN);

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MARKER =
  "canonical M1427 qualification observation result contract privacy surface verified";
export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_RESULT_KEYS = objectFreeze([
  "files", "reviewedSources", "aggregateBytes", "marker"
]);

export function freezeQualificationObservationResultContractPrivacyResult(files, aggregateBytes) {
  requireFrozenDenseArray(
    files,
    QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS.length,
    "qualification observation result-contract privacy files"
  );
  const canonicalFiles = [];
  let recomputedBytes = 0;
  for (let index = 0; index < files.length; index += 1) {
    const descriptor = objectGetOwnPropertyDescriptor(files, String(index));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`qualification observation result-contract privacy files[${index}] must be an enumerable own data element`);
    }
    const evidence = snapshotFrozenFileEvidence(descriptor.value, index);
    recomputedBytes += evidence.bytes;
    if (!Number.isSafeInteger(recomputedBytes)
      || recomputedBytes > QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation result-contract privacy result exceeds aggregate byte ceiling");
    }
    capturedArrayPush(canonicalFiles, evidence);
  }
  if (aggregateBytes !== recomputedBytes) {
    throw new TypeError("qualification observation result-contract privacy aggregate does not match source evidence");
  }
  return objectFreeze({
    files: objectFreeze(canonicalFiles),
    reviewedSources: canonicalFiles.length,
    aggregateBytes: recomputedBytes,
    marker: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MARKER
  });
}

export async function auditQualificationObservationResultContractPrivacySurface(rootDirectory) {
  const root = resolve(rootDirectory);
  if (QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS.sourceCount
    !== QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS.length) {
    throw new TypeError("qualification observation result-contract privacy source count is not canonical");
  }
  let aggregateBytes = 0;
  const files = [];
  for (let index = 0; index < QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS.length; index += 1) {
    const path = QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS[index];
    const source = await readQualificationUtf8File(resolve(root, path), {
      maxBytes: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_SOURCE_BYTES,
      label: path
    });
    const bytes = bufferByteLength(source, "utf8");
    aggregateBytes += bytes;
    if (!Number.isSafeInteger(aggregateBytes)
      || aggregateBytes > QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation result-contract privacy sources exceed aggregate byte ceiling");
    }
    for (let surfaceIndex = 0; surfaceIndex < FORBIDDEN.length; surfaceIndex += 1) {
      const surface = FORBIDDEN[surfaceIndex];
      const label = surface[0];
      const pattern = surface[1];
      if (reflectApply(regexpPrototypeTest, pattern, [source])) {
        throw new Error(`${path} introduces forbidden qualification observation result-contract privacy surface: ${label}`);
      }
    }
    capturedArrayPush(files, objectFreeze({ path, bytes }));
  }
  return freezeQualificationObservationResultContractPrivacyResult(objectFreeze(files), aggregateBytes);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation result-contract privacy audit accepts no arguments");
    console.log((await auditQualificationObservationResultContractPrivacySurface(resolve(import.meta.dirname, ".."))).marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
