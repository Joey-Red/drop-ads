import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readQualificationUtf8File } from "./qualification-file-io.mjs";
import {
  QUALIFICATION_OBSERVATION_HARDENING_LIMITS,
  QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES,
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT,
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS
} from "./qualification-observation-hardening-contract.mjs";
import {
  QUALIFICATION_OBSERVATION_PRIVACY_MARKERS,
  QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS,
  auditQualificationObservationPrivacySurface
} from "./qualification-observation-privacy-surface-audit.mjs";
import {
  QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS,
  QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS,
  QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT,
  auditQualificationObservationPublication
} from "./qualification-observation-publication-audit.mjs";

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
const reflectApply = Reflect.apply;
const reflectOwnKeys = Reflect.ownKeys;

function capturedArrayIncludes(array, value) {
  return reflectApply(arrayPrototypeIncludes, array, [value]);
}

function capturedArrayPush(array, value) {
  reflectApply(arrayPrototypePush, array, [value]);
}

const HARDENING_RESULT_INPUT_KEYS = Object.freeze([
  "files",
  "reviewedSources",
  "aggregateBytes",
  "privacyMarker",
  "privacyMatcherMarker",
  "privacyExecutionMarker",
  "privacySourceEvidenceMarker",
  "publicationIntegrityMarker",
  "publicationReadMarker",
  "preparationPublicationMarker",
  "publicationIdentityMarker"
]);
export const QUALIFICATION_OBSERVATION_HARDENING_RESULT_KEYS = Object.freeze([
  "files",
  "reviewedSources",
  "aggregateBytes",
  "privacyMarker",
  "privacyMatcherMarker",
  "privacyExecutionMarker",
  "privacySourceEvidenceMarker",
  "publicationIntegrityMarker",
  "publicationReadMarker",
  "preparationPublicationMarker",
  "publicationIdentityMarker",
  "marker",
  "extendedMarker",
  "publicationMarker",
  "dependencyMarker",
  "preparationReadMarker",
  "closeoutMarker",
  "identityJsonMarker",
  "trancheCloseoutMarker",
  "privacyResultMarker",
  "publicationResultMarker",
  "writerReadbackMarker",
  "sourceContractMarker",
  "finalCloseoutMarker",
  "contractIntegrationMarker"
]);

const REQUIRED_MARKERS = Object.freeze({
  "tools/qualification-observation-update.mjs": Object.freeze([
    'from "./qualification-observation-text.mjs"',
    "snapshotQualificationObservationArguments",
    "snapshotQualificationObservationUpdate",
    "resetQualificationBrowserScenarioObservations",
    "const versionChanged = current.version !== update.version",
    "withQualificationObservationLock(root",
    "await writeQualificationObservationAtomic",
    "expectedCurrentText: observationText",
    "rootDirectory: root"
  ]),
  "tools/qualification-observation-prepare.mjs": Object.freeze([
    "snapshotQualificationObservationPrepareOptions",
    "const preparedOptions = snapshotQualificationObservationPrepareOptions(options)",
    "withQualificationObservationLock(root",
    "const existingText = await readQualificationUtf8File",
    "await validateCurrentCheckout(root, record)",
    "await writeQualificationObservationAtomic(outputPath, observation",
    "expectedCurrentText: existingText",
    "rootDirectory: root"
  ]),
  "tools/qualification-observation-record-audit.mjs": Object.freeze([
    'from "./qualification-observation-text.mjs"',
    "requireQualificationObservationSchemaV3",
    "validateQualificationObservationRecord",
    "validateQualificationRecord(candidateAsRecord, expectedPackage)",
    "qualification observation artifact identity does not match qualification record",
    "await validateCurrentCheckout(root, qualificationRecord)"
  ]),
  "tools/qualification-observation-text.mjs": Object.freeze([
    "QUALIFICATION_BROWSER_VERSION_MAX_BYTES = 120",
    "QUALIFICATION_OBSERVATION_NOTES_MAX_BYTES = 2_000",
    ".isWellFormed()",
    '.normalize("NFC")',
    'Buffer.byteLength(value, "utf8")'
  ]),
  "tools/qualification-observation-path.mjs": Object.freeze([
    'QUALIFICATION_OBSERVATION_RELATIVE_PATH = "artifacts/qualification-observation.json"',
    "snapshotFrozenExactData",
    "snapshotQualificationObservationTargetOptions",
    "qualificationObservationTemporaryPath",
    "snapshotQualificationObservationRepositoryRoot",
    "revalidateQualificationObservationRepositoryRoot",
    "snapshotQualificationObservationArtifactsDirectory",
    "revalidateQualificationObservationArtifactsDirectory",
    "snapshotQualificationObservationTemporaryIdentity",
    "revalidateQualificationObservationTemporaryPath",
    "removeQualificationObservationTemporaryIfSame",
    "snapshotQualificationObservationTarget",
    "revalidateQualificationObservationTarget",
    "verifyPublishedQualificationObservationTarget",
    'const keys = ["dev", "ino", "mode", "nlink"]',
    'const keys = ["dev", "ino", "mode", "nlink", "size", "mtimeMs", "ctimeMs"]',
    "final publication is not the fsynced temporary file"
  ]),
  "tools/qualification-observation-io.mjs": Object.freeze([
    "snapshotQualificationObservationWriteOptions",
    "assertCanonicalWriterRoot",
    "expected-current snapshot must be well-formed Unicode text",
    'randomBytes(16).toString("hex")',
    "qualificationObservationTemporaryPath(canonicalOutputPath, suffix)",
    'open(temporaryPath, "wx", 0o600)',
    "await handle.sync()",
    "snapshotQualificationObservationTemporaryIdentity(temporaryStat, serializedBytes)",
    "revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity)",
    'label: "qualification observation fsynced temporary"',
    "fsynced temporary bytes do not match canonical serialization",
    "revalidateQualificationObservationRepositoryRoot(rootSnapshot)",
    "revalidateQualificationObservationTarget(targetSnapshot)",
    "revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot)",
    "await rename(temporaryPath, canonicalOutputPath)",
    "verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity)",
    'label: "qualification observation published target"',
    "published bytes do not match canonical serialization",
    "removeQualificationObservationTemporaryIfSame(temporaryPath, temporaryIdentity)"
  ]),
  "tools/qualification-observation-lock.mjs": Object.freeze([
    "snapshotLockIdentity",
    "snapshotLockState",
    'const expectedKeys = ["dev", "ino", "mode", "nlink"]',
    "snapshotQualificationObservationRepositoryRoot(rootDirectory)",
    "snapshotQualificationObservationArtifactsDirectory(rootDirectory)",
    "await mkdir(lockPath, { mode: 0o700 })",
    "snapshotQualificationObservationLockDirectory(lockPath)",
    "revalidateQualificationObservationRepositoryRoot(rootSnapshot)",
    "revalidateQualificationObservationLockDirectory(lockSnapshot)",
    "if (rootStable && parentStable && lockStable)",
    "await rmdir(lockPath)"
  ]),
  "tools/qualification-file-io.mjs": Object.freeze([
    "snapshotQualificationFileReadOptions",
    "snapshotQualificationStreamReadOptions",
    "snapshotQualificationPathReadOptions",
    "snapshotQualificationUtf8FilePath",
    "revalidateQualificationUtf8FilePath",
    "sameFileIdentity",
    "capturePrototypeDataFunction",
    "snapshotIteratorResult",
    "changed between pathname admission and open",
    "changed during bounded read",
    "must be strict UTF-8"
  ]),
  "tools/qualification-json-data.mjs": Object.freeze([
    "MAX_DEPTH = 8",
    "MAX_NODES = 256",
    "MAX_FIELDS_PER_OBJECT = 128",
    "MAX_KEY_BYTES = 256",
    "MAX_STRING_BYTES = 256 * 1024",
    "cloneQualificationJsonData",
    "Object.getOwnPropertyDescriptor(current, key)",
    "return Object.freeze(copy)",
    "JSON.stringify(cloneQualificationJsonData(value, label), null, 2)"
  ])
});

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

export function freezeQualificationObservationHardeningResult(candidate) {
  const safe = snapshotFrozenExactData(candidate, HARDENING_RESULT_INPUT_KEYS, "qualification observation hardening result input");
  const rawFiles = snapshotFrozenDenseArray(
    safe.files,
    QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length,
    "qualification observation hardening result input.files"
  );
  const files = [];
  let aggregateBytes = 0;
  for (let index = 0; index < rawFiles.length; index += 1) {
    const values = snapshotFrozenExactData(
      rawFiles[index],
      ["path", "bytes"],
      `qualification observation hardening result input.files[${index}]`
    );
    const contractEntry = QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT[index];
    if (values.path !== contractEntry.path) {
      throw new TypeError(`qualification observation hardening result input.files[${index}].path is not canonical`);
    }
    if (!Number.isSafeInteger(values.bytes) || values.bytes < 0 || values.bytes > contractEntry.maxBytes) {
      throw new TypeError(`qualification observation hardening result input.files[${index}].bytes is invalid`);
    }
    aggregateBytes += values.bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation hardening result source evidence exceeds aggregate byte ceiling");
    }
    capturedArrayPush(files, objectFreeze({ path: values.path, bytes: values.bytes }));
  }
  if (safe.reviewedSources !== files.length || safe.aggregateBytes !== aggregateBytes) {
    throw new TypeError("qualification observation hardening result count/aggregate does not match source evidence");
  }
  if (safe.privacyMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.marker
    || safe.privacyMatcherMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.extendedMarker
    || safe.privacyExecutionMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.executionMarker
    || safe.privacySourceEvidenceMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.sourceEvidenceMarker) {
    throw new TypeError("qualification observation hardening result privacy markers are not canonical");
  }
  if (safe.publicationIntegrityMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.marker
    || safe.publicationReadMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.extendedMarker
    || safe.preparationPublicationMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.preparationMarker
    || safe.publicationIdentityMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.identityMarker) {
    throw new TypeError("qualification observation hardening result publication markers are not canonical");
  }
  return objectFreeze({
    files: objectFreeze(files),
    reviewedSources: safe.reviewedSources,
    aggregateBytes: safe.aggregateBytes,
    privacyMarker: safe.privacyMarker,
    privacyMatcherMarker: safe.privacyMatcherMarker,
    privacyExecutionMarker: safe.privacyExecutionMarker,
    privacySourceEvidenceMarker: safe.privacySourceEvidenceMarker,
    publicationIntegrityMarker: safe.publicationIntegrityMarker,
    publicationReadMarker: safe.publicationReadMarker,
    preparationPublicationMarker: safe.preparationPublicationMarker,
    publicationIdentityMarker: safe.publicationIdentityMarker,
    marker: "canonical M1344 qualification observation hardening chain verified",
    extendedMarker: "canonical M1347 qualification observation hardening/privacy gate verified",
    publicationMarker: "canonical M1356 qualification observation publication/lock hardening reconciled",
    dependencyMarker: "canonical M1366 qualification observation shared dependency boundaries reviewed",
    preparationReadMarker: "canonical M1376 qualification observation preparation/read hardening reconciled",
    closeoutMarker: "canonical M1378 qualification observation preparation/read integrity closeout verified",
    identityJsonMarker: "canonical M1386 qualification observation identity/JSON hardening reconciled",
    trancheCloseoutMarker: "canonical M1388 qualification observation identity/JSON/privacy integrity closeout verified",
    privacyResultMarker: "canonical M1394 qualification observation privacy child result contract verified",
    publicationResultMarker: "canonical M1395 qualification observation publication child result contract verified",
    writerReadbackMarker: "canonical M1396 qualification observation writer normalization/readback integrity verified",
    sourceContractMarker: "canonical M1397 qualification observation hardening source contract verified",
    finalCloseoutMarker: "canonical M1398 qualification observation writer/privacy/result/source-contract integrity closeout verified",
    contractIntegrationMarker: "canonical M1407 qualification observation hardening contract/privacy/publication integration verified"
  });
}

function requireHardeningContractIntegration() {
  const limits = snapshotFrozenExactData(
    QUALIFICATION_OBSERVATION_HARDENING_LIMITS,
    ["sourceBytes", "sourcePathBytes", "sourceCount", "aggregateBytes", "privacyMatcherCount", "privacyMatcherLabelBytes", "privacyMatcherPatternBytes"],
    "qualification observation hardening limits"
  );
  if (limits.sourceBytes !== 256 * 1024 || limits.sourcePathBytes !== 256 || limits.sourceCount !== 9
    || limits.aggregateBytes !== limits.sourceBytes * limits.sourceCount
    || limits.privacyMatcherCount !== 32 || limits.privacyMatcherLabelBytes !== 64 || limits.privacyMatcherPatternBytes !== 512
    || QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES !== limits.aggregateBytes) {
    throw new TypeError("qualification observation hardening limits are not canonical");
  }
  const paths = snapshotFrozenDenseArray(
    QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS,
    limits.sourceCount,
    "qualification observation hardening source paths"
  );
  if (QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length !== limits.sourceCount) {
    throw new TypeError("qualification observation hardening source contract count does not match canonical limits");
  }
  for (let index = 0; index < limits.sourceCount; index += 1) {
    const entry = snapshotFrozenExactData(
      QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT[index],
      ["path", "maxBytes"],
      `qualification observation hardening source contract[${index}]`
    );
    if (entry.path !== paths[index] || entry.maxBytes !== limits.sourceBytes) {
      throw new TypeError(`qualification observation hardening source contract[${index}] is not canonically integrated`);
    }
  }
  return true;
}

function snapshotPrivacyAuditResult(candidate) {
  const safe = snapshotFrozenExactData(
    candidate,
    QUALIFICATION_OBSERVATION_PRIVACY_RESULT_KEYS,
    "qualification observation privacy result"
  );
  const rawFiles = snapshotFrozenDenseArray(
    safe.files,
    QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length,
    "qualification observation privacy result.files"
  );
  let aggregateBytes = 0;
  const files = [];
  for (let index = 0; index < rawFiles.length; index += 1) {
    const values = snapshotFrozenExactData(rawFiles[index], ["path", "bytes"], `qualification observation privacy result.files[${index}]`);
    const contractEntry = QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT[index];
    if (values.path !== contractEntry.path) throw new TypeError(`qualification observation privacy result.files[${index}].path is not canonical`);
    if (!Number.isSafeInteger(values.bytes) || values.bytes < 0 || values.bytes > contractEntry.maxBytes) {
      throw new TypeError(`qualification observation privacy result.files[${index}].bytes is invalid`);
    }
    aggregateBytes += values.bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation privacy result aggregate is invalid");
    }
    capturedArrayPush(files, objectFreeze({ path: values.path, bytes: values.bytes }));
  }
  if (safe.reviewedSources !== files.length || safe.aggregateBytes !== aggregateBytes) {
    throw new TypeError("qualification observation privacy result count/aggregate does not match source evidence");
  }
  if (safe.marker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.marker
    || safe.extendedMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.extendedMarker
    || safe.executionMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.executionMarker
    || safe.sourceEvidenceMarker !== QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.sourceEvidenceMarker) {
    throw new TypeError("qualification observation privacy result markers are not canonical");
  }
  return objectFreeze({
    files: objectFreeze(files),
    reviewedSources: files.length,
    aggregateBytes,
    marker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.marker,
    extendedMarker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.extendedMarker,
    executionMarker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.executionMarker,
    sourceEvidenceMarker: QUALIFICATION_OBSERVATION_PRIVACY_MARKERS.sourceEvidenceMarker
  });
}

function snapshotPublicationAuditResult(candidate) {
  const safe = snapshotFrozenExactData(
    candidate,
    QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS,
    "qualification observation publication result"
  );
  if (safe.reviewedSources !== QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT) {
    throw new TypeError("qualification observation publication result reviewedSources is not canonical");
  }
  if (safe.marker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.marker
    || safe.extendedMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.extendedMarker
    || safe.preparationMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.preparationMarker
    || safe.identityMarker !== QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.identityMarker) {
    throw new TypeError("qualification observation publication result markers are not canonical");
  }
  return objectFreeze({
    reviewedSources: QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT,
    marker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.marker,
    extendedMarker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.extendedMarker,
    preparationMarker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.preparationMarker,
    identityMarker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.identityMarker
  });
}

function requireMarkers(path, source) {
  const markers = REQUIRED_MARKERS[path];
  if (!markers) throw new Error(`qualification observation hardening audit has no marker contract for ${path}`);
  for (const marker of markers) {
    if (!source.includes(marker)) throw new Error(`${path} missing qualification observation hardening marker: ${marker}`);
  }
}

function requireExactHeadWriteOrdering(source, recordVariable, candidateMarker, writeMarker, label) {
  const validationExpression = `await validateCurrentCheckout(root, ${recordVariable})`;
  const validations = [...source.matchAll(new RegExp(validationExpression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))].map((match) => match.index);
  if (validations.length < 2) throw new Error(`${label} must validate the exact checkout before mutation and immediately before persistence`);
  const candidateIndex = source.indexOf(candidateMarker);
  const finalValidationIndex = validations.find((index) => index > candidateIndex);
  const writeIndex = source.indexOf(writeMarker, finalValidationIndex);
  if (candidateIndex < 0 || finalValidationIndex === undefined || writeIndex <= finalValidationIndex) {
    throw new Error(`${label} exact-head persistence ordering is invalid`);
  }
}

function requireWriterReadbackOrdering(source) {
  const normalizeRoot = source.indexOf("assertCanonicalWriterRoot");
  const openIndex = source.indexOf('open(temporaryPath, "wx", 0o600)');
  const syncIndex = source.indexOf("await handle.sync()", openIndex);
  const identityIndex = source.indexOf("snapshotQualificationObservationTemporaryIdentity(temporaryStat, serializedBytes)", syncIndex);
  const firstTempRevalidation = source.indexOf("revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity)", identityIndex);
  const tempReadback = source.indexOf('label: "qualification observation fsynced temporary"', firstTempRevalidation);
  const tempMismatch = source.indexOf("fsynced temporary bytes do not match canonical serialization", tempReadback);
  const secondTempRevalidation = source.indexOf("revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity)", firstTempRevalidation + 1);
  const renameIndex = source.indexOf("await rename(temporaryPath, canonicalOutputPath)", secondTempRevalidation);
  const firstFinalVerify = source.indexOf("verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity)", renameIndex);
  const finalReadback = source.indexOf('label: "qualification observation published target"', firstFinalVerify);
  const finalMismatch = source.indexOf("published bytes do not match canonical serialization", finalReadback);
  const secondFinalVerify = source.indexOf("verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity)", firstFinalVerify + 1);
  if (!(normalizeRoot >= 0 && openIndex > normalizeRoot && syncIndex > openIndex && identityIndex > syncIndex
    && firstTempRevalidation > identityIndex && tempReadback > firstTempRevalidation && tempMismatch > tempReadback
    && secondTempRevalidation > tempMismatch && renameIndex > secondTempRevalidation && firstFinalVerify > renameIndex
    && finalReadback > firstFinalVerify && finalMismatch > finalReadback && secondFinalVerify > finalMismatch)) {
    throw new Error("qualification observation writer temporary/final byte-readback ordering is invalid");
  }
}

export async function auditQualificationObservationHardening(rootDirectory) {
  const root = resolve(rootDirectory);
  requireHardeningContractIntegration();
  const privacy = snapshotPrivacyAuditResult(await auditQualificationObservationPrivacySurface(root));
  const publication = snapshotPublicationAuditResult(await auditQualificationObservationPublication(root));
  let aggregateBytes = 0;
  const sources = new Map();
  const files = [];
  for (const entry of QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT) {
    const source = await readQualificationUtf8File(resolve(root, entry.path), {
      maxBytes: entry.maxBytes,
      label: entry.path
    });
    const bytes = Buffer.byteLength(source, "utf8");
    aggregateBytes += bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > QUALIFICATION_OBSERVATION_HARDENING_MAX_AGGREGATE_BYTES) {
      throw new RangeError("qualification observation hardening sources exceed aggregate byte ceiling");
    }
    requireMarkers(entry.path, source);
    sources.set(entry.path, source);
    files.push(Object.freeze({ path: entry.path, bytes }));
  }

  requireExactHeadWriteOrdering(
    sources.get("tools/qualification-observation-update.mjs"),
    "qualificationRecord",
    "const nextObservation = applyQualificationObservationUpdate(observation, update)",
    "await writeQualificationObservationAtomic",
    "qualification observation updater"
  );
  requireExactHeadWriteOrdering(
    sources.get("tools/qualification-observation-prepare.mjs"),
    "record",
    "const existingText = await readQualificationUtf8File",
    "await writeQualificationObservationAtomic(outputPath, observation",
    "qualification observation preparer"
  );
  requireWriterReadbackOrdering(sources.get("tools/qualification-observation-io.mjs"));

  return freezeQualificationObservationHardeningResult(Object.freeze({
    files: Object.freeze(files),
    reviewedSources: QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.length,
    aggregateBytes,
    privacyMarker: privacy.marker,
    privacyMatcherMarker: privacy.extendedMarker,
    privacyExecutionMarker: privacy.executionMarker,
    privacySourceEvidenceMarker: privacy.sourceEvidenceMarker,
    publicationIntegrityMarker: publication.marker,
    publicationReadMarker: publication.extendedMarker,
    preparationPublicationMarker: publication.preparationMarker,
    publicationIdentityMarker: publication.identityMarker
  }));
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation hardening audit accepts no arguments");
    const result = await auditQualificationObservationHardening(resolve(import.meta.dirname, ".."));
    console.log(result.marker);
    console.log(result.privacyMarker);
    console.log(result.privacyMatcherMarker);
    console.log(result.privacyExecutionMarker);
    console.log(result.privacySourceEvidenceMarker);
    console.log(result.extendedMarker);
    console.log(result.publicationMarker);
    console.log(result.publicationIntegrityMarker);
    console.log(result.dependencyMarker);
    console.log(result.publicationReadMarker);
    console.log(result.preparationReadMarker);
    console.log(result.preparationPublicationMarker);
    console.log(result.closeoutMarker);
    console.log(result.publicationIdentityMarker);
    console.log(result.identityJsonMarker);
    console.log(result.trancheCloseoutMarker);
    console.log(result.privacyResultMarker);
    console.log(result.publicationResultMarker);
    console.log(result.writerReadbackMarker);
    console.log(result.sourceContractMarker);
    console.log(result.finalCloseoutMarker);
    console.log(result.contractIntegrationMarker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
