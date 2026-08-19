const SOURCE_LIMIT = 256 * 1024;
const MAX_SOURCE_PATH_BYTES = 256;
const EXPECTED_SOURCE_COUNT = 9;
const MAX_PRIVACY_MATCHERS = 32;
const MAX_PRIVACY_MATCHER_LABEL_BYTES = 64;
const MAX_PRIVACY_MATCHER_PATTERN_BYTES = 512;
const FORBIDDEN_SOURCE_PATH_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b\u200c\u200d\u2060\ufeff\u202a-\u202e\u2066-\u2069]/u;

export const QUALIFICATION_OBSERVATION_HARDENING_LIMITS = Object.freeze({
  sourceBytes: SOURCE_LIMIT,
  sourcePathBytes: MAX_SOURCE_PATH_BYTES,
  sourceCount: EXPECTED_SOURCE_COUNT,
  aggregateBytes: EXPECTED_SOURCE_COUNT * SOURCE_LIMIT,
  privacyMatcherCount: MAX_PRIVACY_MATCHERS,
  privacyMatcherLabelBytes: MAX_PRIVACY_MATCHER_LABEL_BYTES,
  privacyMatcherPatternBytes: MAX_PRIVACY_MATCHER_PATTERN_BYTES
});

const reflectOwnKeys = Reflect.ownKeys;
const reflectApply = Reflect.apply;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isFrozen = Object.isFrozen;
const stringIsWellFormed = String.prototype.isWellFormed;
const stringNormalize = String.prototype.normalize;
const stringStartsWith = String.prototype.startsWith;
const stringIncludes = String.prototype.includes;
const stringSplit = String.prototype.split;
const arrayIncludes = Array.prototype.includes;
const arraySome = Array.prototype.some;
const regexpTest = RegExp.prototype.test;

export const QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS = Object.freeze([
  "tools/qualification-observation-update.mjs",
  "tools/qualification-observation-prepare.mjs",
  "tools/qualification-observation-record-audit.mjs",
  "tools/qualification-observation-text.mjs",
  "tools/qualification-observation-path.mjs",
  "tools/qualification-observation-io.mjs",
  "tools/qualification-observation-lock.mjs",
  "tools/qualification-file-io.mjs",
  "tools/qualification-json-data.mjs"
]);

const RAW_HARDENING_SOURCE_CONTRACT = Object.freeze([
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[0], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[1], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[2], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[3], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[4], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[5], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[6], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[7], maxBytes: SOURCE_LIMIT }),
  Object.freeze({ path: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[8], maxBytes: SOURCE_LIMIT })
]);

function snapshotExactFrozenEntry(candidate, index) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) || !isFrozen(candidate)) {
    throw new TypeError(`qualification observation hardening source ${index} must be a frozen plain data object`);
  }
  const prototype = getPrototypeOf(candidate);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`qualification observation hardening source ${index} must be a frozen plain data object`);
  }
  const keys = reflectOwnKeys(candidate);
  if (keys.length !== 2
    || !reflectApply(arrayIncludes, keys, ["path"])
    || !reflectApply(arrayIncludes, keys, ["maxBytes"])
    || reflectApply(arraySome, keys, [(key) => typeof key !== "string"])) {
    throw new TypeError(`qualification observation hardening source ${index} has an invalid field set`);
  }
  const pathDescriptor = getOwnPropertyDescriptor(candidate, "path");
  const maxBytesDescriptor = getOwnPropertyDescriptor(candidate, "maxBytes");
  for (const [key, descriptor] of [["path", pathDescriptor], ["maxBytes", maxBytesDescriptor]]) {
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation hardening source ${index}.${key} must be an enumerable own data field`);
    }
  }
  const path = pathDescriptor.value;
  if (typeof path !== "string" || !path
    || !reflectApply(stringIsWellFormed, path, [])
    || reflectApply(stringNormalize, path, ["NFC"]) !== path
    || Buffer.byteLength(path, "utf8") > QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourcePathBytes
    || reflectApply(regexpTest, FORBIDDEN_SOURCE_PATH_TEXT, [path])
    || !reflectApply(stringStartsWith, path, ["tools/"])
    || reflectApply(stringStartsWith, path, ["/"])
    || reflectApply(stringIncludes, path, ["\\"])
    || reflectApply(stringIncludes, path, ["//"])) {
    throw new TypeError(`qualification observation hardening source ${index}.path is not canonical`);
  }
  const segments = reflectApply(stringSplit, path, ["/"]);
  if (reflectApply(arraySome, segments, [(segment) => !segment || segment === "." || segment === ".."])) {
    throw new TypeError(`qualification observation hardening source ${index}.path is not canonical`);
  }
  if (path !== QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS[index]) {
    throw new TypeError(`qualification observation hardening source ${index}.path is not the reviewed source at this index`);
  }
  if (maxBytesDescriptor.value !== QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceBytes) {
    throw new TypeError(`qualification observation hardening source ${index}.maxBytes must equal the canonical source ceiling`);
  }
  return Object.freeze({ path, maxBytes: QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceBytes });
}

export function snapshotQualificationObservationHardeningSourceContract(entries) {
  if (!Array.isArray(entries) || getPrototypeOf(entries) !== Array.prototype || !isFrozen(entries)
    || entries.length !== QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceCount) {
    throw new TypeError(`qualification observation hardening source contract must be a frozen dense ${QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceCount}-entry array`);
  }
  const expectedKeys = ["length", ...Array.from({ length: QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceCount }, (_, index) => String(index))];
  const ownKeys = reflectOwnKeys(entries);
  if (ownKeys.length !== expectedKeys.length
    || reflectApply(arraySome, ownKeys, [(key) => typeof key !== "string" || !reflectApply(arrayIncludes, expectedKeys, [key])])) {
    throw new TypeError("qualification observation hardening source contract has an invalid array field set");
  }
  const seen = new Set();
  const snapshot = [];
  for (let index = 0; index < QUALIFICATION_OBSERVATION_HARDENING_LIMITS.sourceCount; index += 1) {
    const descriptor = getOwnPropertyDescriptor(entries, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation hardening source contract[${index}] must be an enumerable own data element`);
    }
    const entry = snapshotExactFrozenEntry(descriptor.value, index);
    if (seen.has(entry.path)) throw new TypeError(`qualification observation hardening source path is duplicated: ${entry.path}`);
    seen.add(entry.path);
    snapshot.push(entry);
  }
  return Object.freeze(snapshot);
}

export const QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT =
  snapshotQualificationObservationHardeningSourceContract(RAW_HARDENING_SOURCE_CONTRACT);

export const QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES =
  QUALIFICATION_OBSERVATION_HARDENING_LIMITS.aggregateBytes;
