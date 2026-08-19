import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createBuildInfo } from "./build-info.mjs";
import {
  QUALIFICATION_OBSERVATION_MAX_BYTES,
  QUALIFICATION_PACKAGE_MAX_BYTES,
  QUALIFICATION_RECORD_MAX_BYTES,
  readQualificationUtf8File
} from "./qualification-file-io.mjs";
import { readQualificationGitState } from "./qualification-git.mjs";
import { validateQualificationRecord } from "./qualification-record-audit.mjs";
import { QUALIFICATION_SCENARIOS } from "./qualification-scenarios.mjs";
import { validateQualificationObservationText } from "./qualification-observation-text.mjs";

const ROOT_KEYS = new Set(["schemaVersion", "candidate", "browsers", "scenarios"]);
const CANDIDATE_KEYS = new Set(["package", "commit", "sourceFingerprint", "artifacts"]);
const BROWSERS_KEYS = new Set(["chromium", "firefox"]);
const BROWSER_KEYS = new Set(["version", "notes"]);
const SCENARIO_KEYS = new Set(QUALIFICATION_SCENARIOS);
const V2_SCENARIO_RESULT_KEYS = new Set(["chromium", "firefox", "notes"]);
const V3_SCENARIO_RESULT_KEYS = new Set(["chromium", "firefox"]);
const V3_BROWSER_RESULT_KEYS = new Set(["status", "notes"]);
const STATUSES = new Set(["UNOBSERVED", "PASS", "FAIL", "N/A"]);

function exactDataObject(value, allowedKeys, label) {
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { throw new TypeError(`${label} is not safely inspectable`); }
  if (!value || typeof value !== "object" || isArray) throw new TypeError(`${label} must be an object`);
  let prototype;
  let keys;
  try { prototype = Object.getPrototypeOf(value); keys = Reflect.ownKeys(value); }
  catch { throw new TypeError(`${label} is not safely inspectable`); }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  if (keys.length !== allowedKeys.size || keys.some((key) => typeof key !== "string" || !allowedKeys.has(key))) throw new TypeError(`${label} fields are invalid`);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${String(key)} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}.${String(key)} must be an enumerable data field`);
  }
  return value;
}

function field(value, key, label) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
  catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
  if (!descriptor || !("value" in descriptor)) throw new TypeError(`${label}.${key} is required`);
  return descriptor.value;
}

export function requireQualificationObservationSchemaV3(observation) {
  const schemaVersion = field(observation, "schemaVersion", "qualification observation");
  if (schemaVersion === 2) throw new Error("qualification observation schemaVersion 2 is legacy and cannot be safely auto-migrated because scenario notes were shared; regenerate an exact-head schema-v3 observation with npm run qualify:observation:replace");
  if (schemaVersion !== 3) throw new TypeError("active qualification observation schemaVersion must be 3");
  return true;
}

function safeText(value, label, maxBytes, allowEmpty = true) {
  return validateQualificationObservationText(value, label, maxBytes, { allowEmpty });
}

function sameArtifact(left, right, label) {
  return field(left, "file", `${label}.left`) === field(right, "file", `${label}.right`)
    && field(left, "bytes", `${label}.left`) === field(right, "bytes", `${label}.right`)
    && field(left, "sha256", `${label}.left`) === field(right, "sha256", `${label}.right`);
}

function validateBrowserSlot(slot, label) {
  exactDataObject(slot, BROWSER_KEYS, label);
  return Object.freeze({
    version: safeText(field(slot, "version", label), `${label}.version`, 120),
    notes: safeText(field(slot, "notes", label), `${label}.notes`, 2_000)
  });
}

function validateStatus(value, label) {
  if (typeof value !== "string" || !STATUSES.has(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function validateScenarioResultV2(result, label) {
  exactDataObject(result, V2_SCENARIO_RESULT_KEYS, label);
  const chromium = validateStatus(field(result, "chromium", label), `${label}.chromium`);
  const firefox = validateStatus(field(result, "firefox", label), `${label}.firefox`);
  const notes = safeText(field(result, "notes", label), `${label}.notes`, 2_000);
  if (chromium === "UNOBSERVED" && firefox === "UNOBSERVED" && notes) throw new TypeError(`${label}.notes must be empty while both browsers are UNOBSERVED`);
  return Object.freeze({ chromium, firefox });
}

function validateScenarioBrowserResultV3(result, label) {
  exactDataObject(result, V3_BROWSER_RESULT_KEYS, label);
  const status = validateStatus(field(result, "status", label), `${label}.status`);
  const notes = safeText(field(result, "notes", label), `${label}.notes`, 2_000);
  if (status === "UNOBSERVED" && notes) throw new TypeError(`${label}.notes must be empty while status is UNOBSERVED`);
  return Object.freeze({ status, notes });
}

function validateScenarioResultV3(result, label) {
  exactDataObject(result, V3_SCENARIO_RESULT_KEYS, label);
  return Object.freeze({
    chromium: validateScenarioBrowserResultV3(field(result, "chromium", label), `${label}.chromium`),
    firefox: validateScenarioBrowserResultV3(field(result, "firefox", label), `${label}.firefox`)
  });
}

export function validateQualificationObservationRecord(observation, qualificationRecord, expectedPackage = {}) {
  validateQualificationRecord(qualificationRecord, expectedPackage);
  exactDataObject(observation, ROOT_KEYS, "qualification observation");
  const schemaVersion = field(observation, "schemaVersion", "qualification observation");
  if (schemaVersion !== 2 && schemaVersion !== 3) throw new TypeError("qualification observation schemaVersion must be 2 or 3");

  const candidate = field(observation, "candidate", "qualification observation");
  exactDataObject(candidate, CANDIDATE_KEYS, "qualification observation.candidate");
  const packageValue = field(candidate, "package", "qualification observation.candidate");
  const commit = field(candidate, "commit", "qualification observation.candidate");
  const sourceFingerprint = field(candidate, "sourceFingerprint", "qualification observation.candidate");
  const artifacts = field(candidate, "artifacts", "qualification observation.candidate");
  const authoritativeToolchain = field(qualificationRecord, "toolchain", "qualification record");
  const candidateAsRecord = { schemaVersion: 4, package: packageValue, commit, sourceFingerprint, artifacts, toolchain: authoritativeToolchain };
  validateQualificationRecord(candidateAsRecord, expectedPackage);

  const authoritativePackage = field(qualificationRecord, "package", "qualification record");
  if (field(packageValue, "name", "qualification observation.candidate.package") !== field(authoritativePackage, "name", "qualification record.package")
    || field(packageValue, "version", "qualification observation.candidate.package") !== field(authoritativePackage, "version", "qualification record.package")) throw new TypeError("qualification observation package identity does not match qualification record");
  if (commit !== field(qualificationRecord, "commit", "qualification record")) throw new TypeError("qualification observation commit does not match qualification record");
  if (sourceFingerprint !== field(qualificationRecord, "sourceFingerprint", "qualification record")) throw new TypeError("qualification observation source fingerprint does not match qualification record");

  const authoritativeArtifacts = field(qualificationRecord, "artifacts", "qualification record");
  const chromiumArtifact = field(artifacts, "chromium", "qualification observation.candidate.artifacts");
  const firefoxArtifact = field(artifacts, "firefox", "qualification observation.candidate.artifacts");
  const authoritativeChromium = field(authoritativeArtifacts, "chromium", "qualification record.artifacts");
  const authoritativeFirefox = field(authoritativeArtifacts, "firefox", "qualification record.artifacts");
  if (!sameArtifact(chromiumArtifact, authoritativeChromium, "qualification observation chromium artifact")
    || !sameArtifact(firefoxArtifact, authoritativeFirefox, "qualification observation firefox artifact")) throw new TypeError("qualification observation artifact identity does not match qualification record");

  const browsers = field(observation, "browsers", "qualification observation");
  exactDataObject(browsers, BROWSERS_KEYS, "qualification observation.browsers");
  const browserState = {
    chromium: validateBrowserSlot(field(browsers, "chromium", "qualification observation.browsers"), "qualification observation.browsers.chromium"),
    firefox: validateBrowserSlot(field(browsers, "firefox", "qualification observation.browsers"), "qualification observation.browsers.firefox")
  };
  const scenarios = field(observation, "scenarios", "qualification observation");
  exactDataObject(scenarios, SCENARIO_KEYS, "qualification observation.scenarios");
  let chromiumObserved = false;
  let firefoxObserved = false;
  for (const id of QUALIFICATION_SCENARIOS) {
    const raw = field(scenarios, id, "qualification observation.scenarios");
    if (schemaVersion === 2) {
      const result = validateScenarioResultV2(raw, `qualification observation.scenarios.${id}`);
      chromiumObserved ||= result.chromium !== "UNOBSERVED";
      firefoxObserved ||= result.firefox !== "UNOBSERVED";
    } else {
      const result = validateScenarioResultV3(raw, `qualification observation.scenarios.${id}`);
      chromiumObserved ||= result.chromium.status !== "UNOBSERVED";
      firefoxObserved ||= result.firefox.status !== "UNOBSERVED";
    }
  }
  if (chromiumObserved && !browserState.chromium.version) throw new TypeError("Chromium version is required once any Chromium scenario is observed");
  if (firefoxObserved && !browserState.firefox.version) throw new TypeError("Firefox version is required once any Firefox scenario is observed");
  return true;
}

export async function validateCurrentCheckout(root, qualificationRecord) {
  const [gitState, buildInfo] = await Promise.all([readQualificationGitState(root), createBuildInfo(root)]);
  if (gitState.status.trim()) throw new Error("qualification observation requires a clean source checkout");
  if (gitState.head !== field(qualificationRecord, "commit", "qualification record")) throw new Error("qualification record commit is stale for the current checkout");
  if (buildInfo.sourceFingerprint !== field(qualificationRecord, "sourceFingerprint", "qualification record")) throw new Error("qualification record source fingerprint is stale for the current checkout");
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation record audit accepts no arguments");
    const root = resolve(import.meta.dirname, "..");
    const [packageText, qualificationText, observationText] = await Promise.all([
      readQualificationUtf8File(resolve(root, "package.json"), { maxBytes: QUALIFICATION_PACKAGE_MAX_BYTES, label: "package.json" }),
      readQualificationUtf8File(resolve(root, "artifacts", "qualification-record.json"), { maxBytes: QUALIFICATION_RECORD_MAX_BYTES, label: "qualification record" }),
      readQualificationUtf8File(resolve(root, "artifacts", "qualification-observation.json"), { maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES, label: "qualification observation" })
    ]);
    const packageJson = JSON.parse(packageText);
    const qualificationRecord = JSON.parse(qualificationText);
    const observation = JSON.parse(observationText);
    const expectedPackage = { packageName: packageJson.name, packageVersion: packageJson.version };
    requireQualificationObservationSchemaV3(observation);
    validateQualificationObservationRecord(observation, qualificationRecord, expectedPackage);
    await validateCurrentCheckout(root, qualificationRecord);
    console.log("qualification-observation-record-audit: privacy-minimal exact-head schema-v3 scenario binding verified");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
