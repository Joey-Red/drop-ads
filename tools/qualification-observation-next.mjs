import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_MAX_BYTES,
  QUALIFICATION_PACKAGE_MAX_BYTES,
  QUALIFICATION_RECORD_MAX_BYTES,
  readQualificationUtf8File
} from "./qualification-file-io.mjs";
import {
  QUALIFICATION_SCENARIOS,
  qualificationScenarioBrowserStatus
} from "./qualification-scenarios.mjs";
import {
  requireQualificationObservationSchemaV3,
  validateCurrentCheckout,
  validateQualificationObservationRecord
} from "./qualification-observation-record-audit.mjs";

const BROWSERS = Object.freeze(["chromium", "firefox"]);
const BROWSER_SET = new Set(BROWSERS);

function ownDataValue(object, key, label) {
  if (!object || typeof object !== "object" || Array.isArray(object)) throw new TypeError(`${label} is invalid`);
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
  catch { throw new TypeError(`${label}.${String(key)} is not safely inspectable`); }
  if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}.${String(key)} must be an enumerable data field`);
  return descriptor.value;
}

export function parseQualificationNextArguments(argv) {
  if (!Array.isArray(argv)) throw new TypeError("qualification next-step arguments must be an array");
  if (argv.length > 1) throw new TypeError("qualification next-step accepts at most one browser");
  if (argv.length === 1 && !BROWSER_SET.has(argv[0])) {
    throw new TypeError("qualification next-step browser must be chromium or firefox");
  }
  return argv.length === 1 ? Object.freeze([argv[0]]) : BROWSERS;
}

export function qualificationBrowserVersionRecorded(observation, browser) {
  if (!BROWSER_SET.has(browser)) throw new TypeError("qualification next-step browser must be chromium or firefox");
  const browsers = ownDataValue(observation, "browsers", "qualification observation");
  const slot = ownDataValue(browsers, browser, "qualification observation.browsers");
  const version = ownDataValue(slot, "version", `qualification observation.browsers.${browser}`);
  if (typeof version !== "string") throw new TypeError(`qualification observation.browsers.${browser}.version is invalid`);
  return version.length > 0;
}

export function qualificationNextAction(observation, browser) {
  if (!BROWSER_SET.has(browser)) throw new TypeError("qualification next-step browser must be chromium or firefox");

  const scenarios = ownDataValue(observation, "scenarios", "qualification observation");
  let firstFailure = null;
  let firstUnobserved = null;
  for (const id of QUALIFICATION_SCENARIOS) {
    const result = ownDataValue(scenarios, id, "qualification observation.scenarios");
    const status = qualificationScenarioBrowserStatus(result, browser);
    if (firstFailure === null && status === "FAIL") firstFailure = id;
    if (firstUnobserved === null && status === "UNOBSERVED") firstUnobserved = id;
  }

  const versionRecorded = qualificationBrowserVersionRecorded(observation, browser);
  let action;
  let scenario = null;
  if (!versionRecorded) {
    action = "record-browser-version";
  } else if (firstFailure !== null) {
    action = "resolve-failure";
    scenario = firstFailure;
  } else if (firstUnobserved !== null) {
    action = "observe-scenario";
    scenario = firstUnobserved;
  } else {
    action = "complete";
  }

  return Object.freeze({ versionRecorded, action, scenario });
}

export function summarizeQualificationNext(observation, browsers = BROWSERS) {
  const result = Object.create(null);
  for (const browser of browsers) result[browser] = qualificationNextAction(observation, browser);
  return Object.freeze({ schemaVersion: 1, browsers: Object.freeze(result) });
}

export async function readQualificationNext(rootDirectory, argv = []) {
  const root = resolve(rootDirectory);
  const browsers = parseQualificationNextArguments(argv);
  const [packageText, qualificationText, observationText] = await Promise.all([
    readQualificationUtf8File(resolve(root, "package.json"), {
      maxBytes: QUALIFICATION_PACKAGE_MAX_BYTES,
      label: "package.json"
    }),
    readQualificationUtf8File(resolve(root, "artifacts", "qualification-record.json"), {
      maxBytes: QUALIFICATION_RECORD_MAX_BYTES,
      label: "qualification record"
    }),
    readQualificationUtf8File(resolve(root, "artifacts", "qualification-observation.json"), {
      maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES,
      label: "qualification observation"
    })
  ]);
  const packageJson = JSON.parse(packageText);
  const qualificationRecord = JSON.parse(qualificationText);
  const observation = JSON.parse(observationText);
  requireQualificationObservationSchemaV3(observation);
  validateQualificationObservationRecord(observation, qualificationRecord, {
    packageName: packageJson.name,
    packageVersion: packageJson.version
  });
  await validateCurrentCheckout(root, qualificationRecord);
  return summarizeQualificationNext(observation, browsers);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    const summary = await readQualificationNext(resolve(import.meta.dirname, ".."), process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
