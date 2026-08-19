import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readQualificationUtf8File } from "./qualification-file-io.mjs";
import {
  QUALIFICATION_OBSERVATION_HARDENING_LIMITS,
  QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES,
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT
} from "./qualification-observation-hardening-contract.mjs";

const reflectApply = Reflect.apply;
const reflectOwnKeys = Reflect.ownKeys;
const arrayIsArray = Array.isArray;
const arrayPrototype = Array.prototype;
const arrayPrototypeIncludes = Array.prototype.includes;
const arrayPrototypePush = Array.prototype.push;
const objectPrototype = Object.prototype;
const objectCreate = Object.create;
const objectFreeze = Object.freeze;
const objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const objectGetPrototypeOf = Object.getPrototypeOf;
const objectIsFrozen = Object.isFrozen;
const NativeRegExp = RegExp;
const regexpPrototypeTest = RegExp.prototype.test;
const regexpGlobalGetter = objectGetOwnPropertyDescriptor(RegExp.prototype, "global").get;
const regexpStickyGetter = objectGetOwnPropertyDescriptor(RegExp.prototype, "sticky").get;
const regexpFlagsGetter = objectGetOwnPropertyDescriptor(RegExp.prototype, "flags").get;
const NativeSet = Set;
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

function capturedRegExpGetter(getter, pattern) {
  return reflectApply(getter, pattern, []);
}

export const QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS = objectFreeze([
  "files", "reviewedSources", "aggregateBytes", "marker", "extendedMarker", "executionMarker", "sourceEvidenceMarker"
]);
export const QUALIFICATION_OBSERVATION_PRIVACY_MARKERS = objectFreeze({
  marker: "canonical M1346 qualification observation privacy surface verified",
  extendedMarker: "canonical M1387 qualification observation privacy matcher integrity verified",
  executionMarker: "canonical M1392 qualification observation dynamic execution/subprocess surfaces refused",
  sourceEvidenceMarker: "canonical M1393 qualification observation complete privacy source evidence verified"
});

const RAW_FORBIDDEN_SURFACES = objectFreeze([
  objectFreeze(["fetch", String.raw`\bfetch\s*\(`]),
  objectFreeze(["XMLHttpRequest", String.raw`\bXMLHttpRequest\b`]),
  objectFreeze(["WebSocket", String.raw`\bWebSocket\s*\(`]),
  objectFreeze(["sendBeacon", String.raw`\bsendBeacon\s*\(`]),
  objectFreeze(["browser API", String.raw`\bbrowser\s*\.`]),
  objectFreeze(["chrome API", String.raw`\bchrome\s*\.`]),
  objectFreeze(["navigator API", String.raw`\bnavigator\s*\.`]),
  objectFreeze(["localStorage", String.raw`\blocalStorage\b`]),
  objectFreeze(["sessionStorage", String.raw`\bsessionStorage\b`]),
  objectFreeze(["indexedDB", String.raw`\bindexedDB\b`]),
  objectFreeze(["process environment", String.raw`\bprocess\s*\.\s*env\b`]),
  objectFreeze(["process cwd", String.raw`\bprocess\s*\.\s*cwd\s*\(`]),
  objectFreeze(["host discovery", String.raw`\bhostname\s*\(`]),
  objectFreeze(["user discovery", String.raw`\buserInfo\s*\(`]),
  objectFreeze(["home discovery", String.raw`\bhomedir\s*\(`]),
  objectFreeze(["timestamp collection", String.raw`\bDate\s*\.\s*now\s*\(|\bnew\s+Date\s*\(`]),
  objectFreeze(["performance timing", String.raw`\bperformance\s*\.`]),
  objectFreeze(["network module", String.raw`["'](?:node:)?(?:http|https|net|tls|dns|dgram|undici)["']`]),
  objectFreeze(["child process module", String.raw`["'](?:node:)?child_process["']`]),
  objectFreeze(["worker threads module", String.raw`["'](?:node:)?worker_threads["']`]),
  objectFreeze(["dynamic import", String.raw`\bimport\s*\(`]),
  objectFreeze(["eval", String.raw`\beval\s*\(`]),
  objectFreeze(["Function constructor", String.raw`\b(?:new\s+)?Function\s*\(`]),
  objectFreeze(["process termination", String.raw`\bprocess\s*\.\s*(?:abort|exit|kill)\s*\(`])
]);

function snapshotFrozenExactData(candidate, expectedKeys, label) {
  if (!candidate || typeof candidate !== "object" || arrayIsArray(candidate) || !objectIsFrozen(candidate)) {
    throw new TypeError(`${label} must be a frozen plain data object`);
  }
  const prototype = objectGetPrototypeOf(candidate);
  if (prototype !== objectPrototype && prototype !== null) throw new TypeError(`${label} must be a frozen plain data object`);
  const keys = reflectOwnKeys(candidate);
  if (keys.length !== expectedKeys.length) throw new TypeError(`${label} has an invalid field set`);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (typeof key !== "string" || !capturedArrayIncludes(expectedKeys, key)) {
      throw new TypeError(`${label} has an invalid field set`);
    }
  }
  const values = objectCreate(null);
  for (let index = 0; index < expectedKeys.length; index += 1) {
    const key = expectedKeys[index];
    const descriptor = objectGetOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`${label}.${key} must be an enumerable own data field`);
    }
    values[key] = descriptor.value;
  }
  return objectFreeze(values);
}

function snapshotFrozenDenseArray(candidate, expectedLength, label) {
  if (!arrayIsArray(candidate) || objectGetPrototypeOf(candidate) !== arrayPrototype || !objectIsFrozen(candidate)
    || candidate.length !== expectedLength) {
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
  const values = [];
  for (let index = 0; index < expectedLength; index += 1) {
    const descriptor = objectGetOwnPropertyDescriptor(candidate, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`${label}[${index}] must be an enumerable own data element`);
    }
    capturedArrayPush(values, descriptor.value);
  }
  return values;
}

export function freezeQualificationObservationPrivacyResult(files, aggregateBytes) {
  const rawFiles = snapshotFrozenDenseArray(
    files,
    QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length,
    "qualification observation privacy result files"
  );
  let recomputedBytes = 0;
  const canonicalFiles = [];
  for (let index = 0; index < rawFiles.length; index += 1) {
    const safe = snapshotFrozenExactData(rawFiles[index], ["path", "bytes"], `qualification observation privacy result files[${index}]`);
    const contractEntry = QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT[index];
    if (safe.path !== contractEntry.path) throw new TypeError(`qualification observation privacy result files[${index}].path is not canonical`);
    if (!Number.isSafeInteger(safe.bytes) || safe.bytes < 0 || safe.bytes > contractEntry.maxBytes) {
      throw new TypeError(`qualification observation privacy result files[${index}].bytes is invalid`);
    }
    recomputedBytes += safe.bytes;
    if (!Number.isSafeInteger(recomputedBytes) || recomputedBytes > QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation privacy result aggregate is invalid");
    }
    capturedArrayPush(canonicalFiles, objectFreeze({ path: safe.path, bytes: safe.bytes }));
  }
  if (aggregateBytes !== recomputedBytes) {
    throw new TypeError("qualification observation privacy result aggregate does not match canonical source evidence");
  }
  return objectFreeze({
    files: objectFreeze(canonicalFiles),
    reviewedSources: canonicalFiles.length,
    aggregateBytes: recomputedBytes,
    marker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.marker,
    extendedMarker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.extendedMarker,
    executionMarker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.executionMarker,
    sourceEvidenceMarker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.sourceEvidenceMarker
  });
}

export function snapshotQualificationObservationPrivacyMatcherInventory(entries) {
  if (!arrayIsArray(entries) || !objectIsFrozen(entries) || entries.length === 0
    || entries.length > QUALIFICATION_OBSERVATION_HARDENING_LIMITS.privacyMatcherCount) {
    throw new TypeError("qualification observation privacy matcher inventory is invalid");
  }
  const rawEntries = snapshotFrozenDenseArray(entries, entries.length, "qualification observation privacy matcher inventory");
  const labels = new NativeSet();
  const snapshot = [];
  for (let index = 0; index < rawEntries.length; index += 1) {
    const tuple = snapshotFrozenDenseArray(rawEntries[index], 2, `qualification observation privacy matcher ${index}`);
    const label = tuple[0];
    const source = tuple[1];
    if (typeof label !== "string" || !label
      || Buffer.byteLength(label, "utf8") > QUALIFICATION_OBSERVATION_HARDENING_LIMITS.privacyMatcherLabelBytes) {
      throw new TypeError(`qualification observation privacy matcher ${index} label is invalid`);
    }
    if (typeof source !== "string" || !source
      || Buffer.byteLength(source, "utf8") > QUALIFICATION_OBSERVATION_HARDENING_LIMITS.privacyMatcherPatternBytes) {
      throw new TypeError(`qualification observation privacy matcher ${index} source is invalid`);
    }
    if (capturedSetHas(labels, label)) throw new TypeError(`qualification observation privacy matcher label is duplicated: ${label}`);
    capturedSetAdd(labels, label);
    capturedArrayPush(snapshot, objectFreeze([label, source]));
  }
  return objectFreeze(snapshot);
}

export const QUALIFICATION_OBSERVATION_PRIVACY_MATCHER_COUNT = RAW_FORBIDDEN_SURFACES.length;
const PRIVACY_MATCHER_INVENTORY = snapshotQualificationObservationPrivacyMatcherInventory(RAW_FORBIDDEN_SURFACES);

export function compileQualificationObservationPrivacyMatchers(entries) {
  const canonicalEntries = snapshotQualificationObservationPrivacyMatcherInventory(entries);
  const compiled = [];
  for (let index = 0; index < canonicalEntries.length; index += 1) {
    const label = canonicalEntries[index][0];
    const source = canonicalEntries[index][1];
    const pattern = new NativeRegExp(source, "u");
    if (capturedRegExpGetter(regexpGlobalGetter, pattern)
      || capturedRegExpGetter(regexpStickyGetter, pattern)
      || capturedRegExpGetter(regexpFlagsGetter, pattern) !== "u") {
      throw new TypeError(`qualification observation privacy matcher ${label} must be stateless Unicode regex`);
    }
    objectFreeze(pattern);
    capturedArrayPush(compiled, objectFreeze({ label, source, pattern }));
  }
  return objectFreeze(compiled);
}

const FORBIDDEN_SURFACES = compileQualificationObservationPrivacyMatchers(PRIVACY_MATCHER_INVENTORY);

function matchesForbiddenSurface(pattern, source) {
  return reflectApply(regexpPrototypeTest, pattern, [source]);
}

export async function auditQualificationObservationPrivacySurface(rootDirectory) {
  const root = resolve(rootDirectory);
  let aggregateBytes = 0;
  const files = [];
  for (const entry of QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT) {
    const source = await readQualificationUtf8File(resolve(root, entry.path), {
      maxBytes: entry.maxBytes,
      label: entry.path
    });
    const bytes = Buffer.byteLength(source, "utf8");
    aggregateBytes += bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation privacy sources exceed aggregate byte ceiling");
    }
    for (const surface of FORBIDDEN_SURFACES) {
      if (matchesForbiddenSurface(surface.pattern, source)) {
        throw new Error(`${entry.path} introduces forbidden qualification observation privacy surface: ${surface.label}`);
      }
    }
    capturedArrayPush(files, objectFreeze({ path: entry.path, bytes }));
  }
  if (files.length !== QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length) {
    throw new Error("qualification observation privacy scan did not cover the complete canonical source contract");
  }
  return freezeQualificationObservationPrivacyResult(objectFreeze(files), aggregateBytes);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation privacy surface audit accepts no arguments");
    const result = await auditQualificationObservationPrivacySurface(resolve(import.meta.dirname, ".."));
    console.log(result.marker);
    console.log(result.extendedMarker);
    console.log(result.executionMarker);
    console.log(result.sourceEvidenceMarker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
