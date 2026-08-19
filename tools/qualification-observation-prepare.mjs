import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_MAX_BYTES,
  QUALIFICATION_PACKAGE_MAX_BYTES,
  QUALIFICATION_RECORD_MAX_BYTES,
  readQualificationUtf8File
} from "./qualification-file-io.mjs";
import {
  cloneQualificationJsonData,
  stringifyQualificationJsonData
} from "./qualification-json-data.mjs";
import { validateQualificationRecord } from "./qualification-record-audit.mjs";
import { createUnobservedScenarioMatrixV3 } from "./qualification-scenarios.mjs";
import { validateCurrentCheckout } from "./qualification-observation-record-audit.mjs";
import { writeQualificationObservationAtomic } from "./qualification-observation-io.mjs";
import { withQualificationObservationLock } from "./qualification-observation-lock.mjs";

const RECORD_PATH = "artifacts/qualification-record.json";
const OUTPUT_PATH = "artifacts/qualification-observation.json";

function artifactCopy(value) {
  return Object.freeze({ file: value.file, bytes: value.bytes, sha256: value.sha256 });
}

export function snapshotQualificationObservationPrepareOptions(options) {
  if (options === undefined) return Object.freeze({ replace: false });
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("qualification observation prepare options must be an object");
  }
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(options);
    keys = Reflect.ownKeys(options);
  } catch {
    throw new TypeError("qualification observation prepare options are not safely inspectable");
  }
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("qualification observation prepare options must be a plain data object");
  }
  if (keys.some((key) => typeof key !== "string" || key !== "replace") || keys.length > 1) {
    throw new TypeError("qualification observation prepare option fields are invalid");
  }
  let replace = false;
  if (keys.length === 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(options, "replace"); }
    catch { throw new TypeError("qualification observation prepare replace option is not safely inspectable"); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable || typeof descriptor.value !== "boolean") {
      throw new TypeError("qualification observation prepare replace must be an enumerable own boolean data field");
    }
    replace = descriptor.value;
  }
  return Object.freeze({ replace });
}

export function createQualificationObservationSeed(record, expectedPackage) {
  validateQualificationRecord(record, expectedPackage);
  const safeRecord = cloneQualificationJsonData(record, "qualification record");
  return Object.freeze({
    schemaVersion: 3,
    candidate: Object.freeze({
      package: Object.freeze({ name: safeRecord.package.name, version: safeRecord.package.version }),
      commit: safeRecord.commit,
      sourceFingerprint: safeRecord.sourceFingerprint,
      artifacts: Object.freeze({
        chromium: artifactCopy(safeRecord.artifacts.chromium),
        firefox: artifactCopy(safeRecord.artifacts.firefox)
      })
    }),
    browsers: Object.freeze({
      chromium: Object.freeze({ version: "", notes: "" }),
      firefox: Object.freeze({ version: "", notes: "" })
    }),
    scenarios: createUnobservedScenarioMatrixV3()
  });
}

export async function prepareQualificationObservation(rootDirectory, options) {
  const preparedOptions = snapshotQualificationObservationPrepareOptions(options);
  const root = resolve(rootDirectory);

  return withQualificationObservationLock(root, async () => {
    const [packageText, recordText] = await Promise.all([
      readQualificationUtf8File(resolve(root, "package.json"), {
        maxBytes: QUALIFICATION_PACKAGE_MAX_BYTES,
        label: "package.json"
      }),
      readQualificationUtf8File(resolve(root, RECORD_PATH), {
        maxBytes: QUALIFICATION_RECORD_MAX_BYTES,
        label: "qualification record"
      })
    ]);
    const packageJson = JSON.parse(packageText);
    const record = JSON.parse(recordText);
    const expectedPackage = { packageName: packageJson.name, packageVersion: packageJson.version };
    validateQualificationRecord(record, expectedPackage);
    await validateCurrentCheckout(root, record);

    const observation = createQualificationObservationSeed(record, expectedPackage);
    const outputPath = resolve(root, OUTPUT_PATH);
    const existingText = await readQualificationUtf8File(outputPath, {
      maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES,
      label: "qualification observation",
      allowMissing: true
    });
    if (existingText !== null && !preparedOptions.replace) {
      let identicalSeed = false;
      try {
        identicalSeed = stringifyQualificationJsonData(JSON.parse(existingText), "existing qualification observation")
          === stringifyQualificationJsonData(observation, "qualification observation seed");
      } catch {
        throw new Error("qualification observation is unreadable; use the explicit replace command to discard it");
      }
      if (identicalSeed) return observation;
      throw new Error("qualification observation already exists; use the explicit replace command to discard it");
    }

    await validateCurrentCheckout(root, record);
    await writeQualificationObservationAtomic(outputPath, observation, {
      expectedCurrentText: existingText,
      rootDirectory: root
    });
    return observation;
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && args[0] !== "--replace")) {
      throw new Error("qualification observation preparation accepts only optional --replace");
    }
    await prepareQualificationObservation(resolve(import.meta.dirname, ".."), { replace: args[0] === "--replace" });
    console.log("qualification-observation-prepare: privacy-minimal schema-v3 UNOBSERVED scenario seed ready");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
