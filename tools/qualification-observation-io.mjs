import { randomBytes } from "node:crypto";
import { open, rename } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import {
  QUALIFICATION_OBSERVATION_MAX_BYTES,
  readQualificationUtf8File
} from "./qualification-file-io.mjs";
import { stringifyQualificationJsonData } from "./qualification-json-data.mjs";
import {
  assertQualificationObservationOutputPath,
  qualificationObservationTemporaryPath,
  removeQualificationObservationTemporaryIfSame,
  revalidateQualificationObservationArtifactsDirectory,
  revalidateQualificationObservationRepositoryRoot,
  revalidateQualificationObservationTarget,
  revalidateQualificationObservationTemporaryPath,
  snapshotQualificationObservationArtifactsDirectory,
  snapshotQualificationObservationRepositoryRoot,
  snapshotQualificationObservationTarget,
  snapshotQualificationObservationTemporaryIdentity,
  verifyPublishedQualificationObservationTarget
} from "./qualification-observation-path.mjs";

const WRITE_OPTION_KEYS = new Set(["expectedCurrentText", "rootDirectory"]);

function assertCanonicalWriterRoot(value) {
  if (typeof value !== "string" || !value || !isAbsolute(value) || resolve(value) !== value) {
    throw new TypeError("qualification observation writer rootDirectory must be a canonical absolute path when provided");
  }
  return value;
}

export function snapshotQualificationObservationWriteOptions(options) {
  if (options === undefined) {
    return Object.freeze({ expectedCurrentText: undefined, rootDirectory: undefined });
  }
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("qualification observation writer options must be a plain data object");
  }
  const prototype = Object.getPrototypeOf(options);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("qualification observation writer options must be a plain data object");
  }
  const keys = Reflect.ownKeys(options);
  if (keys.some((key) => typeof key !== "string" || !WRITE_OPTION_KEYS.has(key))) {
    throw new TypeError("qualification observation writer options contain unsupported fields");
  }
  const values = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(options, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation writer option ${key} must be an enumerable own data field`);
    }
    values[key] = descriptor.value;
  }
  const rootDirectory = values.rootDirectory === undefined
    ? undefined
    : assertCanonicalWriterRoot(values.rootDirectory);
  return Object.freeze({
    expectedCurrentText: normalizeExpectedCurrentText(values.expectedCurrentText),
    rootDirectory
  });
}

function normalizeExpectedCurrentText(value) {
  if (value === undefined || value === null) return value;
  if (typeof value !== "string") throw new TypeError("qualification observation expected-current snapshot must be text or null");
  if (!value.isWellFormed()) throw new TypeError("qualification observation expected-current snapshot must be well-formed Unicode text");
  if (Buffer.byteLength(value, "utf8") > QUALIFICATION_OBSERVATION_MAX_BYTES) {
    throw new RangeError(`qualification observation expected-current snapshot exceeds ${QUALIFICATION_OBSERVATION_MAX_BYTES} bytes`);
  }
  return value;
}

export async function writeQualificationObservationAtomic(outputPath, observation, options) {
  const safeOptions = snapshotQualificationObservationWriteOptions(options);
  const { expectedCurrentText, rootDirectory } = safeOptions;
  const canonicalOutputPath = rootDirectory === undefined
    ? outputPath
    : assertQualificationObservationOutputPath(rootDirectory, outputPath);
  const expectedText = expectedCurrentText;
  const rootSnapshot = rootDirectory === undefined
    ? null
    : await snapshotQualificationObservationRepositoryRoot(rootDirectory);
  const artifactsSnapshot = rootDirectory === undefined
    ? null
    : await snapshotQualificationObservationArtifactsDirectory(rootDirectory);
  const targetSnapshot = rootDirectory === undefined
    ? null
    : await snapshotQualificationObservationTarget(canonicalOutputPath, { allowMissing: expectedText === null });
  const serialized = stringifyQualificationJsonData(observation, "qualification observation");
  const serializedBytes = Buffer.byteLength(serialized, "utf8");
  if (serializedBytes > QUALIFICATION_OBSERVATION_MAX_BYTES) {
    throw new RangeError(`qualification observation exceeds ${QUALIFICATION_OBSERVATION_MAX_BYTES} bytes`);
  }

  const suffix = randomBytes(16).toString("hex");
  const temporaryPath = qualificationObservationTemporaryPath(canonicalOutputPath, suffix);
  let temporaryIdentity = null;
  try {
    const handle = await open(temporaryPath, "wx", 0o600);
    try {
      await handle.writeFile(serialized, { encoding: "utf8" });
      await handle.sync();
      const temporaryStat = await handle.stat();
      temporaryIdentity = snapshotQualificationObservationTemporaryIdentity(temporaryStat, serializedBytes);
    } finally {
      await handle.close();
    }

    if (expectedText !== undefined) {
      const currentText = await readQualificationUtf8File(canonicalOutputPath, {
        maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES,
        label: "qualification observation conflict check",
        allowMissing: expectedText === null,
        allowEmpty: true
      });
      if (currentText !== expectedText) {
        throw new Error("qualification observation changed during update; reload it and retry");
      }
    }

    await revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity);
    const temporaryText = await readQualificationUtf8File(temporaryPath, {
      maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES,
      label: "qualification observation fsynced temporary",
      allowEmpty: true
    });
    if (temporaryText !== serialized) {
      throw new Error("qualification observation fsynced temporary bytes do not match canonical serialization");
    }
    await revalidateQualificationObservationTemporaryPath(temporaryPath, temporaryIdentity);
    if (targetSnapshot) await revalidateQualificationObservationTarget(targetSnapshot);
    if (artifactsSnapshot) await revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot);
    if (rootSnapshot) await revalidateQualificationObservationRepositoryRoot(rootSnapshot);
    await rename(temporaryPath, canonicalOutputPath);
    await verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity);
    const publishedText = await readQualificationUtf8File(canonicalOutputPath, {
      maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES,
      label: "qualification observation published target",
      allowEmpty: true
    });
    if (publishedText !== serialized) {
      throw new Error("qualification observation published bytes do not match canonical serialization");
    }
    await verifyPublishedQualificationObservationTarget(canonicalOutputPath, serializedBytes, temporaryIdentity);
    if (artifactsSnapshot) await revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot);
    if (rootSnapshot) await revalidateQualificationObservationRepositoryRoot(rootSnapshot);
  } catch (error) {
    if (temporaryIdentity) {
      await removeQualificationObservationTemporaryIfSame(temporaryPath, temporaryIdentity).catch(() => false);
    }
    throw error;
  }
}
