import { NATIVE_LIST_FORMAT } from "../src/core/lists.js";
import { SOURCE_QUALIFICATION_FAILURE_CODE } from "./source-qualification-failure.mjs";
import { compareQualificationText } from "./source-qualification-order.mjs";
import { assertSourceDeclaredBytes, assertSourceRowRuleCeiling } from "./source-qualification-report-limits.mjs";
import { stringifyValidatedSourceQualificationReport } from "./source-qualification-report-serialize.mjs";

export const SOURCE_QUALIFICATION_REPORT_MAX_BYTES = 128 * 1024;
export const SOURCE_QUALIFICATION_REPORT_MAX_ROWS = 64;
const UNSAFE_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;
const SOURCE_REPORT_FORMATS = new Set([NATIVE_LIST_FORMAT, "third-party", "hosts"]);

function exactDataObject(value, keys, label) {
  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch { throw new TypeError(`${label} is not safely inspectable`); }
  if (!value || typeof value !== "object" || Array.isArray(value) || (prototype !== Object.prototype && prototype !== null)) throw new TypeError(`${label} must be a plain object`);
  if (ownKeys.length !== keys.length || ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))) throw new TypeError(`${label} fields are invalid`);
  const result = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}.${key} must be an enumerable data field`);
    result[key] = descriptor.value;
  }
  return result;
}

function denseArray(value, label, snapshot) {
  let keys;
  let lengthDescriptor;
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError();
    keys = Reflect.ownKeys(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch { throw new TypeError(`${label} must be a standard dense array`); }
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length < 0 || length > SOURCE_QUALIFICATION_REPORT_MAX_ROWS || keys.length !== length + 1) throw new TypeError(`${label} length is invalid`);
  const result = [];
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, String(index)); }
    catch { throw new TypeError(`${label}[${index}] is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label} must not contain holes or accessors`);
    result.push(snapshot(descriptor.value, index));
  }
  return result;
}

function safeText(value, label, max) {
  if (typeof value !== "string" || !value || value.length > max || UNSAFE_TEXT.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} is invalid`);
  return value;
}

function snapshotCounts(value, label, keys) {
  const fields = exactDataObject(value, keys, label);
  const result = Object.create(null);
  for (const key of keys) result[key] = count(fields[key], `${label}.${key}`);
  return Object.freeze(result);
}

function assertSectionConsistency(section, leftKey, rightKey, label) {
  const direct = section[leftKey] + section[rightKey];
  const classified = section.uniqueContribution + section.overlapWithEarlierSources;
  if (!Number.isSafeInteger(direct) || direct !== section.supported) throw new TypeError(`${label}.supported is inconsistent`);
  if (!Number.isSafeInteger(classified) || classified !== section.supported) throw new TypeError(`${label} contribution counts are inconsistent`);
}

function snapshotSourceRow(value, index) {
  const fields = exactDataObject(value, ["id", "title", "enabledByDefault", "format", "declaredBytes", "network", "cosmetic"], `source report row ${index}`);
  const id = safeText(fields.id, `source report row ${index}.id`, 96);
  if (!/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(id)) throw new TypeError(`source report row ${index}.id is invalid`);
  const title = safeText(fields.title, `source report row ${index}.title`, 120);
  if (title !== title.trim()) throw new TypeError(`source report row ${index}.title must be canonical trimmed text`);
  const format = safeText(fields.format, `source report row ${index}.format`, 32);
  if (!SOURCE_REPORT_FORMATS.has(format)) throw new TypeError(`source report row ${index}.format is unsupported`);
  if (typeof fields.enabledByDefault !== "boolean") throw new TypeError(`source report row ${index}.enabledByDefault is invalid`);
  const declaredBytes = assertSourceDeclaredBytes(fields.declaredBytes);
  const network = snapshotCounts(fields.network, `source report row ${index}.network`, ["block", "allow", "supported", "uniqueContribution", "overlapWithEarlierSources"]);
  const cosmetic = snapshotCounts(fields.cosmetic, `source report row ${index}.cosmetic`, ["hide", "allow", "supported", "uniqueContribution", "overlapWithEarlierSources"]);
  assertSectionConsistency(network, "block", "allow", `source report row ${index}.network`);
  assertSectionConsistency(cosmetic, "hide", "allow", `source report row ${index}.cosmetic`);
  assertSourceRowRuleCeiling(network, cosmetic);
  return Object.freeze({ id, title, enabledByDefault: fields.enabledByDefault, format, declaredBytes, network, cosmetic });
}

function snapshotFailure(value, index) {
  const fields = exactDataObject(value, ["id", "error"], `source failure ${index}`);
  const id = safeText(fields.id, `source failure ${index}.id`, 96);
  if (!/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(id) || fields.error !== SOURCE_QUALIFICATION_FAILURE_CODE) throw new TypeError(`source failure ${index} is invalid`);
  return Object.freeze({ id, error: SOURCE_QUALIFICATION_FAILURE_CODE });
}

function assertTotalsConsistency(sources, totals) {
  let network = 0;
  let cosmetic = 0;
  for (const source of sources) {
    network += source.network.uniqueContribution;
    cosmetic += source.cosmetic.uniqueContribution;
    if (!Number.isSafeInteger(network) || !Number.isSafeInteger(cosmetic)) throw new TypeError("source qualification report totals overflow the safe integer range");
  }
  if (totals.uniqueNetworkRules !== network) throw new TypeError("source qualification report uniqueNetworkRules total is inconsistent");
  if (totals.uniqueCosmeticRules !== cosmetic) throw new TypeError("source qualification report uniqueCosmeticRules total is inconsistent");
}

function assertStrictAscendingIds(rows, label) {
  let previous = null;
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.id)) throw new TypeError(`${label} contains duplicate id ${row.id}`);
    if (previous !== null && compareQualificationText(previous, row.id) >= 0) throw new TypeError(`${label} must be strictly ascending by id`);
    seen.add(row.id);
    previous = row.id;
  }
  return seen;
}

function assertIdentitySets(sources, failures) {
  const sourceIds = assertStrictAscendingIds(sources, "source qualification report.sources");
  const failureIds = assertStrictAscendingIds(failures, "source qualification report.failures");
  for (const id of failureIds) {
    if (sourceIds.has(id)) throw new TypeError(`source qualification report id ${id} cannot be both successful and failed`);
  }
}

function assertCombinedOutcomeBound(sources, failures) {
  const combined = sources.length + failures.length;
  if (!Number.isSafeInteger(combined) || combined > SOURCE_QUALIFICATION_REPORT_MAX_ROWS) {
    throw new TypeError(`source qualification report contains more than ${SOURCE_QUALIFICATION_REPORT_MAX_ROWS} combined outcomes`);
  }
}

export function validateSourceQualificationReport(report) {
  const fields = exactDataObject(report, ["sources", "totals", "failures"], "source qualification report");
  const sources = denseArray(fields.sources, "source qualification report.sources", snapshotSourceRow);
  const failures = denseArray(fields.failures, "source qualification report.failures", snapshotFailure);
  const totals = snapshotCounts(fields.totals, "source qualification report.totals", ["uniqueNetworkRules", "uniqueCosmeticRules"]);
  assertCombinedOutcomeBound(sources, failures);
  assertTotalsConsistency(sources, totals);
  assertIdentitySets(sources, failures);
  return Object.freeze({ sources: Object.freeze(sources), totals, failures: Object.freeze(failures) });
}

export function serializeSourceQualificationReport(report) {
  const safe = validateSourceQualificationReport(report);
  const text = stringifyValidatedSourceQualificationReport(safe);
  if (Buffer.byteLength(text, "utf8") > SOURCE_QUALIFICATION_REPORT_MAX_BYTES) throw new RangeError("Source qualification report exceeds its byte ceiling");
  return text;
}
