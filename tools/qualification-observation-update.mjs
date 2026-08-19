import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_MAX_BYTES,
  QUALIFICATION_PACKAGE_MAX_BYTES,
  QUALIFICATION_RECORD_MAX_BYTES,
  readQualificationUtf8File
} from "./qualification-file-io.mjs";
import { cloneQualificationJsonData } from "./qualification-json-data.mjs";
import { QUALIFICATION_SCENARIOS } from "./qualification-scenarios.mjs";
import { validateQualificationObservationText } from "./qualification-observation-text.mjs";
import {
  requireQualificationObservationSchemaV3,
  validateCurrentCheckout,
  validateQualificationObservationRecord
} from "./qualification-observation-record-audit.mjs";
import { writeQualificationObservationAtomic } from "./qualification-observation-io.mjs";
import { withQualificationObservationLock } from "./qualification-observation-lock.mjs";

const BROWSERS = new Set(["chromium", "firefox"]);
const BROWSER_KEYS = Object.freeze(["chromium", "firefox"]);
const STATUSES = new Set(["PASS", "FAIL", "N/A", "UNOBSERVED"]);
const SCENARIOS = new Set(QUALIFICATION_SCENARIOS);
const SCENARIO_LEAF_KEYS = Object.freeze(["status", "notes"]);
const RECORD_PATH = "artifacts/qualification-record.json";
const OBSERVATION_PATH = "artifacts/qualification-observation.json";
const BROWSER_UPDATE_KEYS = new Set(["kind", "browser", "version", "notes", "replace"]);
const SCENARIO_UPDATE_KEYS = new Set(["kind", "scenario", "browser", "status", "notes", "replace"]);
const MAX_OBSERVATION_ARGV_ENTRIES = 32;
const MAX_OBSERVATION_ARG_BYTES = 4_096;
const MAX_OBSERVATION_ARGV_BYTES = 16_384;

function safeText(value, label, maxBytes, { allowEmpty = true } = {}) {
  return validateQualificationObservationText(value, label, maxBytes, { allowEmpty });
}

function snapshotExactDataObject(candidate, expectedKeys, label) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new TypeError(`${label} must be an object`);
  const prototype = Object.getPrototypeOf(candidate);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain data object`);
  const keys = Reflect.ownKeys(candidate);
  const expected = new Set(expectedKeys);
  if (keys.length !== expected.size || keys.some((key) => typeof key !== "string" || !expected.has(key))) throw new TypeError(`${label} fields are invalid`);
  const values = Object.create(null);
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) throw new TypeError(`${label}.${key} must be an enumerable own data field`);
    values[key] = descriptor.value;
  }
  return values;
}

export function snapshotQualificationObservationArguments(argv) {
  if (!Array.isArray(argv)) throw new TypeError("qualification observation arguments must be an array");
  const length = Object.getOwnPropertyDescriptor(argv, "length")?.value;
  if (!Number.isSafeInteger(length) || length <= 0 || length > MAX_OBSERVATION_ARGV_ENTRIES) throw new TypeError("qualification observation argument count is invalid");
  const expectedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
  const keys = Reflect.ownKeys(argv);
  if (keys.length !== expectedKeys.size || keys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) throw new TypeError("qualification observation arguments must be a dense exact array");
  const copy = [];
  let aggregateBytes = 0;
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(argv, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || typeof descriptor.value !== "string") throw new TypeError(`qualification observation argument ${index} must be an own string data property`);
    const bytes = Buffer.byteLength(descriptor.value, "utf8");
    if (bytes > MAX_OBSERVATION_ARG_BYTES) throw new TypeError(`qualification observation argument ${index} exceeds its byte ceiling`);
    aggregateBytes += bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > MAX_OBSERVATION_ARGV_BYTES) throw new TypeError("qualification observation arguments exceed their aggregate byte ceiling");
    copy.push(descriptor.value);
  }
  return Object.freeze(copy);
}

function parseFlags(tokens, allowed) {
  const result = Object.create(null);
  for (let index = 0; index < tokens.length; index += 1) {
    const flag = tokens[index];
    if (!allowed.has(flag)) throw new TypeError(`unknown qualification observation option: ${flag}`);
    if (Object.hasOwn(result, flag)) throw new TypeError(`duplicate qualification observation option: ${flag}`);
    if (flag === "--replace") { result[flag] = true; continue; }
    const value = tokens[index + 1];
    if (value === undefined || value.startsWith("--")) throw new TypeError(`${flag} requires a value`);
    result[flag] = value;
    index += 1;
  }
  return result;
}

export function parseQualificationObservationUpdateArguments(argv) {
  const args = snapshotQualificationObservationArguments(argv);
  const [kind, ...rest] = args;
  if (kind === "browser") {
    if (rest.length < 3) throw new TypeError("browser update requires <chromium|firefox> --version <value>");
    const browser = rest[0];
    if (!BROWSERS.has(browser)) throw new TypeError("browser must be chromium or firefox");
    const flags = parseFlags(rest.slice(1), new Set(["--version", "--notes", "--replace"]));
    if (!Object.hasOwn(flags, "--version")) throw new TypeError("browser update requires --version");
    return snapshotQualificationObservationUpdate({ kind: "browser", browser, version: flags["--version"], notes: Object.hasOwn(flags, "--notes") ? flags["--notes"] : undefined, replace: flags["--replace"] === true });
  }
  if (kind === "scenario") {
    if (rest.length < 3) throw new TypeError("scenario update requires <scenario-id> <chromium|firefox> <status>");
    const [scenario, browser, status, ...flagTokens] = rest;
    if (!SCENARIOS.has(scenario)) throw new TypeError(`unknown qualification scenario: ${scenario}`);
    if (!BROWSERS.has(browser)) throw new TypeError("browser must be chromium or firefox");
    if (!STATUSES.has(status)) throw new TypeError("status must be PASS, FAIL, N/A, or UNOBSERVED");
    const flags = parseFlags(flagTokens, new Set(["--notes", "--replace"]));
    if (status === "UNOBSERVED" && Object.hasOwn(flags, "--notes")) throw new TypeError("UNOBSERVED scenario reset cannot include --notes");
    return snapshotQualificationObservationUpdate({ kind: "scenario", scenario, browser, status, notes: Object.hasOwn(flags, "--notes") ? flags["--notes"] : undefined, replace: flags["--replace"] === true });
  }
  throw new TypeError("qualification observation update command must be browser or scenario");
}

export function cloneQualificationObservationData(value) { return cloneQualificationJsonData(value, "qualification observation"); }

export function snapshotQualificationObservationUpdate(update) {
  if (!update || typeof update !== "object" || Array.isArray(update)) throw new TypeError("qualification observation update must be an object");
  let prototype; let keys;
  try { prototype = Object.getPrototypeOf(update); keys = Reflect.ownKeys(update); } catch { throw new TypeError("qualification observation update is not safely inspectable"); }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError("qualification observation update must be a plain data object");
  if (keys.some((key) => typeof key !== "string")) throw new TypeError("qualification observation update contains a symbol field");
  const values = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(update, key); } catch { throw new TypeError(`qualification observation update.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`qualification observation update.${key} must be an enumerable data field`);
    values[key] = descriptor.value;
  }
  const kind = values.kind;
  const expectedKeys = kind === "browser" ? BROWSER_UPDATE_KEYS : kind === "scenario" ? SCENARIO_UPDATE_KEYS : null;
  if (!expectedKeys) throw new TypeError("unsupported qualification observation update kind");
  if (keys.length !== expectedKeys.size || keys.some((key) => !expectedKeys.has(key))) throw new TypeError("qualification observation update fields are invalid");
  if (!BROWSERS.has(values.browser)) throw new TypeError("browser must be chromium or firefox");
  if (typeof values.replace !== "boolean") throw new TypeError("qualification observation update replace must be boolean");
  if (kind === "browser") {
    const version = safeText(values.version, "browser version", 120, { allowEmpty: false });
    const notes = values.notes === undefined ? undefined : safeText(values.notes, "browser notes", 2_000);
    return Object.freeze({ kind, browser: values.browser, version, notes, replace: values.replace });
  }
  if (!SCENARIOS.has(values.scenario)) throw new TypeError(`unknown qualification scenario: ${values.scenario}`);
  if (!STATUSES.has(values.status)) throw new TypeError("status must be PASS, FAIL, N/A, or UNOBSERVED");
  if (values.status === "UNOBSERVED" && values.notes !== undefined) throw new TypeError("UNOBSERVED scenario reset cannot include notes");
  const notes = values.notes === undefined ? undefined : safeText(values.notes, "scenario notes", 2_000);
  return Object.freeze({ kind, scenario: values.scenario, browser: values.browser, status: values.status, notes, replace: values.replace });
}

export function resetQualificationBrowserScenarioObservations(draft, browser) {
  if (!BROWSERS.has(browser)) throw new TypeError("browser must be chromium or firefox");
  const scenarios = draft?.scenarios;
  const scenarioKeys = Reflect.ownKeys(scenarios ?? {});
  if (scenarioKeys.length !== QUALIFICATION_SCENARIOS.length || scenarioKeys.some((key) => typeof key !== "string" || !SCENARIOS.has(key))) throw new TypeError("qualification observation scenario graph must contain exactly the canonical scenarios");
  const targets = [];
  for (const scenario of QUALIFICATION_SCENARIOS) {
    const scenarioDescriptor = Object.getOwnPropertyDescriptor(scenarios, scenario);
    if (!scenarioDescriptor || !("value" in scenarioDescriptor) || "get" in scenarioDescriptor || "set" in scenarioDescriptor || !scenarioDescriptor.enumerable) throw new TypeError(`qualification observation scenario ${scenario} must be an enumerable own data field`);
    const buckets = snapshotExactDataObject(scenarioDescriptor.value, BROWSER_KEYS, `qualification observation scenario ${scenario}`);
    for (const candidateBrowser of BROWSER_KEYS) {
      const leaf = snapshotExactDataObject(buckets[candidateBrowser], SCENARIO_LEAF_KEYS, `qualification observation scenario ${scenario}.${candidateBrowser}`);
      if (!STATUSES.has(leaf.status) || typeof leaf.notes !== "string") throw new TypeError(`qualification observation scenario ${scenario}.${candidateBrowser} is invalid`);
    }
    targets.push(scenarioDescriptor.value);
  }
  for (const target of targets) target[browser] = { status: "UNOBSERVED", notes: "" };
}

function updateBrowser(draft, update) {
  const current = draft.browsers[update.browser];
  const versionChanged = current.version !== update.version;
  if (!update.replace && current.version && versionChanged) throw new Error(`${update.browser} version is already recorded; use --replace to change it`);
  if (!update.replace && update.notes !== undefined && current.notes !== update.notes && current.notes) throw new Error(`${update.browser} notes are already recorded; use --replace to change them`);
  current.version = update.version;
  if (update.notes !== undefined) current.notes = update.notes;
  if (versionChanged) resetQualificationBrowserScenarioObservations(draft, update.browser);
}

function updateScenarioV3(draft, update) {
  const current = draft.scenarios[update.scenario][update.browser];
  if (!update.replace && current.status !== "UNOBSERVED" && current.status !== update.status) throw new Error(`${update.scenario} ${update.browser} is already ${current.status}; use --replace to change it`);
  if (!update.replace && update.notes !== undefined && current.notes && current.notes !== update.notes) throw new Error(`${update.scenario} ${update.browser} notes are already recorded; use --replace to change them`);
  if (update.status !== "UNOBSERVED" && !draft.browsers[update.browser].version.trim()) throw new Error(`record the ${update.browser} browser version before marking scenarios`);
  current.status = update.status;
  if (update.notes !== undefined) current.notes = update.notes;
  if (current.status === "UNOBSERVED") current.notes = "";
}

export function applyQualificationObservationUpdate(observation, update) {
  requireQualificationObservationSchemaV3(observation);
  const safeUpdate = snapshotQualificationObservationUpdate(update);
  const draft = cloneQualificationObservationData(observation);
  if (safeUpdate.kind === "browser") updateBrowser(draft, safeUpdate); else updateScenarioV3(draft, safeUpdate);
  return draft;
}

export async function updateQualificationObservation(rootDirectory, argv) {
  const root = resolve(rootDirectory);
  const update = parseQualificationObservationUpdateArguments(argv);
  return withQualificationObservationLock(root, async () => {
    const [packageText, recordText, observationText] = await Promise.all([
      readQualificationUtf8File(resolve(root, "package.json"), { maxBytes: QUALIFICATION_PACKAGE_MAX_BYTES, label: "package.json" }),
      readQualificationUtf8File(resolve(root, RECORD_PATH), { maxBytes: QUALIFICATION_RECORD_MAX_BYTES, label: "qualification record" }),
      readQualificationUtf8File(resolve(root, OBSERVATION_PATH), { maxBytes: QUALIFICATION_OBSERVATION_MAX_BYTES, label: "qualification observation" })
    ]);
    const packageJson = JSON.parse(packageText);
    const qualificationRecord = JSON.parse(recordText);
    const observation = JSON.parse(observationText);
    const expectedPackage = { packageName: packageJson.name, packageVersion: packageJson.version };
    requireQualificationObservationSchemaV3(observation);
    validateQualificationObservationRecord(observation, qualificationRecord, expectedPackage);
    await validateCurrentCheckout(root, qualificationRecord);
    const nextObservation = applyQualificationObservationUpdate(observation, update);
    validateQualificationObservationRecord(nextObservation, qualificationRecord, expectedPackage);
    await validateCurrentCheckout(root, qualificationRecord);
    await writeQualificationObservationAtomic(resolve(root, OBSERVATION_PATH), nextObservation, {
      expectedCurrentText: observationText,
      rootDirectory: root
    });
    return nextObservation;
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; } catch { return false; }
}

if (isMainModule()) {
  try { await updateQualificationObservation(resolve(import.meta.dirname, ".."), process.argv.slice(2)); console.log("qualification-observation-update: exact-head schema-v3 observation updated"); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
