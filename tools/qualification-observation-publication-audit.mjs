import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readQualificationUtf8File } from "./qualification-file-io.mjs";
import {
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT,
  QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS
} from "./qualification-observation-hardening-contract.mjs";

const arrayIsArray = Array.isArray;
const objectGetPrototypeOf = Object.getPrototypeOf;
const objectIsFrozen = Object.isFrozen;
const objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const reflectOwnKeys = Reflect.ownKeys;
const reflectApply = Reflect.apply;
const arrayPrototypeIncludes = Array.prototype.includes;
const arrayPrototypePush = Array.prototype.push;

const RAW_REVIEWED_PATHS = Object.freeze([
  "tools/qualification-observation-path.mjs",
  "tools/qualification-observation-io.mjs",
  "tools/qualification-observation-lock.mjs",
  "tools/qualification-file-io.mjs",
  "tools/qualification-observation-prepare.mjs"
]);

function capturedArrayIncludes(array, value) {
  return reflectApply(arrayPrototypeIncludes, array, [value]);
}

function capturedArrayPush(array, value) {
  reflectApply(arrayPrototypePush, array, [value]);
}

export function snapshotQualificationObservationPublicationPaths(paths) {
  const expectedLength = RAW_REVIEWED_PATHS.length;
  if (!arrayIsArray(paths) || objectGetPrototypeOf(paths) !== Array.prototype || !objectIsFrozen(paths)
    || paths.length !== expectedLength) {
    throw new TypeError(`qualification observation publication paths must be a frozen dense ${expectedLength}-entry array`);
  }
  const expectedKeys = ["length"];
  for (let index = 0; index < expectedLength; index += 1) capturedArrayPush(expectedKeys, String(index));
  const ownKeys = reflectOwnKeys(paths);
  if (ownKeys.length !== expectedKeys.length) {
    throw new TypeError("qualification observation publication paths have an invalid field set");
  }
  for (let index = 0; index < ownKeys.length; index += 1) {
    const key = ownKeys[index];
    if (typeof key !== "string" || !capturedArrayIncludes(expectedKeys, key)) {
      throw new TypeError("qualification observation publication paths have an invalid field set");
    }
  }
  const snapshot = [];
  for (let index = 0; index < expectedLength; index += 1) {
    const descriptor = objectGetOwnPropertyDescriptor(paths, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation publication paths[${index}] must be an enumerable own data element`);
    }
    const path = descriptor.value;
    if (typeof path !== "string" || path !== RAW_REVIEWED_PATHS[index]
      || !capturedArrayIncludes(QUALIFICATION_OBSERVATION_HARDENING_SOURCE_PATHS, path)) {
      throw new TypeError(`qualification observation publication paths[${index}] is not the canonical reviewed source`);
    }
    capturedArrayPush(snapshot, path);
  }
  return Object.freeze(snapshot);
}

export const QUALIFICATION_OBSERVATION_PUBLICATION_PATHS =
  snapshotQualificationObservationPublicationPaths(RAW_REVIEWED_PATHS);
export const QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT =
  QUALIFICATION_OBSERVATION_PUBLICATION_PATHS.length;
export const QUALIFICATION_OBSERVATION_PUBLICATION_RESULT_KEYS = Object.freeze([
  "reviewedSources", "marker", "extendedMarker", "preparationMarker", "identityMarker"
]);
export const QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS = Object.freeze({
  marker: "canonical M1357 qualification observation publication integrity verified",
  extendedMarker: "canonical M1367 qualification observation publication/read integrity verified",
  preparationMarker: "canonical M1377 qualification observation prepare/publication integrity verified",
  identityMarker: "canonical M1386 qualification observation publication identity hardening reconciled"
});
const REVIEWED_PATHS = QUALIFICATION_OBSERVATION_PUBLICATION_PATHS;

export function freezeQualificationObservationPublicationResult(reviewedSources) {
  if (reviewedSources !== QUALIFICATION_OBSERVATION_PUBLICATION_SOURCE_COUNT) {
    throw new TypeError("qualification observation publication result reviewedSources is not canonical");
  }
  return Object.freeze({
    reviewedSources,
    marker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.marker,
    extendedMarker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.extendedMarker,
    preparationMarker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.preparationMarker,
    identityMarker: QUALIFICATION_OBSERVATION_PUBLICATION_MARKERS.identityMarker
  });
}

async function readReviewedSource(root, path) {
  const entry = QUALIFICATION_OBSERVATION_HARDENING_SOURCE_CONTRACT.find((candidate) => candidate.path === path);
  if (!entry) throw new Error(`qualification observation publication audit source is outside the hardening contract: ${path}`);
  return readQualificationUtf8File(resolve(root, path), { maxBytes: entry.maxBytes, label: path });
}

function requireMarker(source, marker, label) {
  if (!source.includes(marker)) throw new Error(`${label} missing qualification observation publication marker: ${marker}`);
}

export async function auditQualificationObservationPublication(rootDirectory) {
  const root = resolve(rootDirectory);
  const [pathSource, ioSource, lockSource, fileIoSource, prepareSource] = await Promise.all(
    REVIEWED_PATHS.map((path) => readReviewedSource(root, path))
  );

  for (const marker of [
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
  ]) requireMarker(pathSource, marker, REVIEWED_PATHS[0]);

  for (const marker of [
    "snapshotQualificationObservationWriteOptions",
    'randomBytes(16).toString("hex")',
    "qualificationObservationTemporaryPath(canonicalOutputPath, suffix)",
    'open(temporaryPath, "wx", 0o600)',
    "await handle.sync()",
    "snapshotQualificationObservationTemporaryIdentity(temporaryStat, serializedBytes)",
    "readQualificationUtf8File(canonicalOutputPath",
    "revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity)",
    "revalidateQualificationObservationTarget(targetSnapshot)",
    "revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot)",
    "revalidateQualificationObservationRepositoryRoot(rootSnapshot)",
    "await rename(temporaryPath, canonicalOutputPath)",
    "verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity)",
    "removeQualificationObservationTemporaryIfSame(temporaryPath, temporaryIdentity)"
  ]) requireMarker(ioSource, marker, REVIEWED_PATHS[1]);

  const optionsIndex = ioSource.indexOf("snapshotQualificationObservationWriteOptions(options)");
  const openIndex = ioSource.indexOf('open(temporaryPath, "wx", 0o600)', optionsIndex);
  const syncIndex = ioSource.indexOf("await handle.sync()", openIndex);
  const tempIdentityIndex = ioSource.indexOf("snapshotQualificationObservationTemporaryIdentity(temporaryStat, serializedBytes)", syncIndex);
  const conflictIndex = ioSource.indexOf("readQualificationUtf8File(canonicalOutputPath", tempIdentityIndex);
  const tempPathIndex = ioSource.indexOf("revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity)", conflictIndex);
  const targetIndex = ioSource.indexOf("revalidateQualificationObservationTarget(targetSnapshot)", tempPathIndex);
  const parentIndex = ioSource.indexOf("revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot)", targetIndex);
  const rootIndex = ioSource.indexOf("revalidateQualificationObservationRepositoryRoot(rootSnapshot)", parentIndex);
  const renameIndex = ioSource.indexOf("await rename(temporaryPath, canonicalOutputPath)", rootIndex);
  const verifyIndex = ioSource.indexOf(
    "verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity)",
    renameIndex
  );
  const finalParentIndex = ioSource.indexOf("revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot)", verifyIndex);
  const finalRootIndex = ioSource.indexOf("revalidateQualificationObservationRepositoryRoot(rootSnapshot)", finalParentIndex);
  if (!(optionsIndex >= 0 && openIndex > optionsIndex && syncIndex > openIndex && tempIdentityIndex > syncIndex
    && conflictIndex > tempIdentityIndex && tempPathIndex > conflictIndex && targetIndex > tempPathIndex
    && parentIndex > targetIndex && rootIndex > parentIndex && renameIndex > rootIndex
    && verifyIndex > renameIndex && finalParentIndex > verifyIndex && finalRootIndex > finalParentIndex)) {
    throw new Error("qualification observation publication ordering is invalid");
  }

  for (const marker of [
    "snapshotLockIdentity",
    "snapshotLockState",
    "snapshotQualificationObservationRepositoryRoot(rootDirectory)",
    "snapshotQualificationObservationArtifactsDirectory(rootDirectory)",
    "await mkdir(lockPath, { mode: 0o700 })",
    "snapshotQualificationObservationLockDirectory(lockPath)",
    "revalidateQualificationObservationRepositoryRoot(rootSnapshot)",
    "revalidateQualificationObservationLockDirectory(lockSnapshot)",
    'const expectedKeys = ["dev", "ino", "mode", "nlink"]',
    "if (rootStable && parentStable && lockStable)",
    "await rmdir(lockPath)"
  ]) requireMarker(lockSource, marker, REVIEWED_PATHS[2]);

  const rootSnapshotIndex = lockSource.indexOf("snapshotQualificationObservationRepositoryRoot(rootDirectory)");
  const mkdirIndex = lockSource.indexOf("await mkdir(lockPath, { mode: 0o700 })", rootSnapshotIndex);
  const snapshotIndex = lockSource.indexOf("snapshotQualificationObservationLockDirectory(lockPath)", mkdirIndex);
  const afterCreateRootIndex = lockSource.indexOf("revalidateQualificationObservationRepositoryRoot(rootSnapshot)", snapshotIndex);
  const finalRootIndexInLock = lockSource.lastIndexOf("revalidateQualificationObservationRepositoryRoot(rootSnapshot)");
  const finalLockIndex = lockSource.lastIndexOf("revalidateQualificationObservationLockDirectory(lockSnapshot)");
  const rmdirIndex = lockSource.indexOf("await rmdir(lockPath)");
  if (!(rootSnapshotIndex >= 0 && mkdirIndex > rootSnapshotIndex && snapshotIndex > mkdirIndex
    && afterCreateRootIndex > snapshotIndex && finalRootIndexInLock > afterCreateRootIndex
    && finalLockIndex > finalRootIndexInLock && rmdirIndex > finalLockIndex)) {
    throw new Error("qualification observation lock publication ordering is invalid");
  }

  for (const marker of [
    "snapshotQualificationFileReadOptions",
    "snapshotQualificationPathReadOptions",
    "snapshotQualificationUtf8FilePath",
    "sameFileIdentity",
    "capturePrototypeDataFunction",
    "snapshotIteratorResult",
    "changed between pathname admission and open",
    "changed during bounded read",
    "revalidateQualificationUtf8FilePath(pathnameSnapshot, label)"
  ]) requireMarker(fileIoSource, marker, REVIEWED_PATHS[3]);

  for (const marker of [
    "snapshotQualificationObservationPrepareOptions",
    "const preparedOptions = snapshotQualificationObservationPrepareOptions(options)",
    "withQualificationObservationLock(root",
    'const outputPath = resolve(root, OUTPUT_PATH)',
    "const existingText = await readQualificationUtf8File",
    "await validateCurrentCheckout(root, record)",
    "await writeQualificationObservationAtomic(outputPath, observation",
    "expectedCurrentText: existingText",
    "rootDirectory: root"
  ]) requireMarker(prepareSource, marker, REVIEWED_PATHS[4]);

  const prepareOptionsIndex = prepareSource.indexOf("snapshotQualificationObservationPrepareOptions(options)");
  const prepareLockIndex = prepareSource.indexOf("withQualificationObservationLock(root", prepareOptionsIndex);
  const prepareValidations = [...prepareSource.matchAll(/await validateCurrentCheckout\(root, record\)/g)].map((match) => match.index);
  const prepareExistingIndex = prepareSource.indexOf("const existingText = await readQualificationUtf8File", prepareLockIndex);
  const prepareWriteIndex = prepareSource.indexOf("await writeQualificationObservationAtomic(outputPath, observation", prepareExistingIndex);
  const prepareRootOptionIndex = prepareSource.indexOf("rootDirectory: root", prepareWriteIndex);
  if (!(prepareOptionsIndex >= 0 && prepareLockIndex > prepareOptionsIndex && prepareValidations.length >= 2
    && prepareValidations[0] > prepareLockIndex && prepareExistingIndex > prepareValidations[0]
    && prepareValidations.at(-1) > prepareExistingIndex && prepareWriteIndex > prepareValidations.at(-1)
    && prepareRootOptionIndex > prepareWriteIndex)) {
    throw new Error("qualification observation preparation publication ordering is invalid");
  }

  return freezeQualificationObservationPublicationResult(REVIEWED_PATHS.length);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation publication audit accepts no arguments");
    const result = await auditQualificationObservationPublication(resolve(import.meta.dirname, ".."));
    console.log(result.marker);
    console.log(result.extendedMarker);
    console.log(result.preparationMarker);
    console.log(result.identityMarker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
