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

function emptyCounts() {
  return { PASS: 0, FAIL: 0, "N/A": 0, UNOBSERVED: 0 };
}

export function summarizeQualificationObservation(observation, qualificationRecord, expectedPackage = {}) {
  validateQualificationObservationRecord(observation, qualificationRecord, expectedPackage);
  const chromium = emptyCounts();
  const firefox = emptyCounts();

  for (const id of QUALIFICATION_SCENARIOS) {
    const result = observation.scenarios[id];
    chromium[qualificationScenarioBrowserStatus(result, "chromium")] += 1;
    firefox[qualificationScenarioBrowserStatus(result, "firefox")] += 1;
  }

  const summarizeBrowser = (counts) => Object.freeze({
    pass: counts.PASS,
    fail: counts.FAIL,
    notApplicable: counts["N/A"],
    unobserved: counts.UNOBSERVED,
    complete: counts.UNOBSERVED === 0,
    passing: counts.UNOBSERVED === 0 && counts.FAIL === 0
  });

  const chromiumSummary = summarizeBrowser(chromium);
  const firefoxSummary = summarizeBrowser(firefox);
  return Object.freeze({
    schemaVersion: 1,
    scenarioCount: QUALIFICATION_SCENARIOS.length,
    browsers: Object.freeze({ chromium: chromiumSummary, firefox: firefoxSummary }),
    ready: chromiumSummary.passing && firefoxSummary.passing
  });
}

export async function readQualificationStatus(rootDirectory) {
  const root = resolve(rootDirectory);
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
  const expectedPackage = {
    packageName: packageJson.name,
    packageVersion: packageJson.version
  };
  requireQualificationObservationSchemaV3(observation);
  validateQualificationObservationRecord(observation, qualificationRecord, expectedPackage);
  await validateCurrentCheckout(root, qualificationRecord);
  return summarizeQualificationObservation(observation, qualificationRecord, expectedPackage);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation summary accepts no arguments");
    const summary = await readQualificationStatus(resolve(import.meta.dirname, ".."));
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
