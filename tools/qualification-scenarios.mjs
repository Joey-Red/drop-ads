export const QUALIFICATION_SCENARIOS = Object.freeze([
  "startup-core",
  "protection-recovery",
  "personal-precedence",
  "cookie-policy",
  "list-cache",
  "dnr-capacity-recovery",
  "settings-popup-sync",
  "country-policy",
  "cosmetics-picker-cleanup",
  "community-boundary",
  "backup-import",
  "hostile-input-bounds",
  "deterministic-fixture",
  "cookie-banner-rejection",
  "privacy-invariants"
]);

const QUALIFICATION_BROWSERS = new Set(["chromium", "firefox"]);
const QUALIFICATION_STATUSES = new Set(["UNOBSERVED", "PASS", "FAIL", "N/A"]);

function browserName(browser) {
  if (!QUALIFICATION_BROWSERS.has(browser)) throw new TypeError("qualification browser must be chromium or firefox");
  return browser;
}

export function createQualificationScenarioBrowserResult() {
  return Object.freeze({ status: "UNOBSERVED", notes: "" });
}

export function createQualificationScenarioResultV3() {
  return Object.freeze({
    chromium: createQualificationScenarioBrowserResult(),
    firefox: createQualificationScenarioBrowserResult()
  });
}

export function createUnobservedScenarioMatrixV3() {
  const matrix = Object.create(null);
  for (const id of QUALIFICATION_SCENARIOS) {
    matrix[id] = createQualificationScenarioResultV3();
  }
  return Object.freeze(matrix);
}

export function createUnobservedScenarioMatrix() {
  const matrix = Object.create(null);
  for (const id of QUALIFICATION_SCENARIOS) {
    matrix[id] = Object.freeze({ chromium: "UNOBSERVED", firefox: "UNOBSERVED", notes: "" });
  }
  return Object.freeze(matrix);
}

function ownDataValue(object, key, label) {
  if (!object || typeof object !== "object" || Array.isArray(object)) throw new TypeError(`${label} is invalid`);
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor || !("value" in descriptor)) throw new TypeError(`${label}.${key} is invalid`);
  return descriptor.value;
}

function qualificationScenarioBrowserSlot(result, browser) {
  const name = browserName(browser);
  const value = ownDataValue(result, name, "qualification scenario result");
  if (typeof value === "string") {
    if (!QUALIFICATION_STATUSES.has(value)) throw new TypeError("qualification scenario status is invalid");
    const sharedNotes = ownDataValue(result, "notes", "qualification scenario result");
    if (typeof sharedNotes !== "string") throw new TypeError("qualification scenario notes are invalid");
    return Object.freeze({ schemaVersion: 2, status: value, notes: "" });
  }
  const status = ownDataValue(value, "status", `qualification scenario result.${name}`);
  const notes = ownDataValue(value, "notes", `qualification scenario result.${name}`);
  if (typeof status !== "string" || !QUALIFICATION_STATUSES.has(status)) throw new TypeError("qualification scenario status is invalid");
  if (typeof notes !== "string") throw new TypeError("qualification scenario notes are invalid");
  return Object.freeze({ schemaVersion: 3, status, notes });
}

export function qualificationScenarioBrowserStatus(result, browser) {
  return qualificationScenarioBrowserSlot(result, browser).status;
}

export function qualificationScenarioBrowserNotes(result, browser) {
  return qualificationScenarioBrowserSlot(result, browser).notes;
}
