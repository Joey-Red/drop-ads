import { normalizeSubscription, subscriptionSourceKey } from "../src/core/subscriptions.js";
import { MAX_REMOTE_SUPPORTED_RULES } from "../src/core/list-limits.js";
import { normalizeRule } from "../src/core/rules.js";
import { normalizeCosmeticRule } from "../src/core/cosmetic-rules.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "../src/core/object-schema.js";

export const MAX_SOURCE_QUALIFICATION_RESULTS = 64;
export const MAX_QUALIFICATION_CATALOG_SOURCES = 64;
const PARSED_RESULT_KEYS = new Set(["block", "allow", "cosmeticHide", "cosmeticAllow", "sourceKey"]);

export function snapshotQualificationSourceCatalog(catalog) {
  let prototype;
  let keys;
  let lengthDescriptor;
  try {
    if (!Array.isArray(catalog)) throw new TypeError();
    prototype = Object.getPrototypeOf(catalog);
    keys = Reflect.ownKeys(catalog);
    lengthDescriptor = Object.getOwnPropertyDescriptor(catalog, "length");
  } catch { throw new TypeError("Qualification source catalog must be a standard dense array"); }
  if (prototype !== Array.prototype || !lengthDescriptor || !("value" in lengthDescriptor)) {
    throw new TypeError("Qualification source catalog must be a standard dense array");
  }
  const length = lengthDescriptor.value;
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_QUALIFICATION_CATALOG_SOURCES || keys.length !== length + 1 || !keys.includes("length")) {
    throw new TypeError("Qualification source catalog length is invalid");
  }
  const snapshot = [];
  const seenIds = new Set();
  const seenSourceKeys = new Set();
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(catalog, String(index)); }
    catch { throw new TypeError(`Qualification source catalog[${index}] is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError("Qualification source catalog must not contain holes or accessors");
    }
    const subscription = Object.freeze(normalizeSubscription(descriptor.value));
    const sourceKey = subscriptionSourceKey(subscription);
    if (seenIds.has(subscription.id)) throw new TypeError(`Qualification source catalog contains duplicate id: ${subscription.id}`);
    if (seenSourceKeys.has(sourceKey)) throw new TypeError("Qualification source catalog contains duplicate source identity");
    seenIds.add(subscription.id);
    seenSourceKeys.add(sourceKey);
    snapshot.push(subscription);
  }
  return Object.freeze(snapshot);
}

function freezeNormalizedNetworkRule(rule) {
  const normalized = normalizeRule(rule);
  const resourceTypes = normalized.resourceTypes ? Object.freeze([...normalized.resourceTypes]) : undefined;
  return Object.freeze({
    kind: normalized.kind,
    value: normalized.value,
    ...(resourceTypes ? { resourceTypes } : {})
  });
}

function freezeNormalizedCosmeticRule(rule) {
  const normalized = normalizeCosmeticRule(rule);
  const domains = normalized.domains ? Object.freeze([...normalized.domains]) : undefined;
  const excludedDomains = normalized.excludedDomains ? Object.freeze([...normalized.excludedDomains]) : undefined;
  return Object.freeze({
    selector: normalized.selector,
    ...(domains ? { domains } : {}),
    ...(excludedDomains ? { excludedDomains } : {})
  });
}

function snapshotParsedPolicy(parsed, index, expectedSourceKey) {
  assertPlainExactObject(parsed, `Source qualification result ${index}.parsed`, PARSED_RESULT_KEYS);
  const fields = Object.create(null);
  for (const key of PARSED_RESULT_KEYS) {
    const field = readPlainDataField(parsed, key);
    if (!field.safe || !field.present) {
      throw new TypeError(`Source qualification result ${index}.parsed.${key} must be an enumerable data field`);
    }
    fields[key] = field.value;
  }
  const block = snapshotDenseDataArray(fields.block, `Source qualification result ${index}.parsed.block`, MAX_REMOTE_SUPPORTED_RULES).map(freezeNormalizedNetworkRule);
  const allow = snapshotDenseDataArray(fields.allow, `Source qualification result ${index}.parsed.allow`, MAX_REMOTE_SUPPORTED_RULES).map(freezeNormalizedNetworkRule);
  const cosmeticHide = snapshotDenseDataArray(fields.cosmeticHide, `Source qualification result ${index}.parsed.cosmeticHide`, MAX_REMOTE_SUPPORTED_RULES).map(freezeNormalizedCosmeticRule);
  const cosmeticAllow = snapshotDenseDataArray(fields.cosmeticAllow, `Source qualification result ${index}.parsed.cosmeticAllow`, MAX_REMOTE_SUPPORTED_RULES).map(freezeNormalizedCosmeticRule);
  const total = block.length + allow.length + cosmeticHide.length + cosmeticAllow.length;
  if (total > MAX_REMOTE_SUPPORTED_RULES) throw new RangeError("Source qualification parsed policy exceeds the supported-rule ceiling");
  if (typeof fields.sourceKey !== "string" || fields.sourceKey !== expectedSourceKey) {
    throw new TypeError(`Source qualification result ${index}.parsed.sourceKey does not match its subscription`);
  }
  return Object.freeze({
    block: Object.freeze(block),
    allow: Object.freeze(allow),
    cosmeticHide: Object.freeze(cosmeticHide),
    cosmeticAllow: Object.freeze(cosmeticAllow),
    sourceKey: expectedSourceKey
  });
}

function exactResultEntry(entry, index) {
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(entry);
    keys = Reflect.ownKeys(entry);
  } catch { throw new TypeError(`Source qualification result ${index} is not safely inspectable`); }
  if (!entry || typeof entry !== "object" || Array.isArray(entry) || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError(`Source qualification result ${index} must be a plain object`);
  }
  const expected = ["subscription", "parsed", "declaredBytes"];
  if (keys.length !== expected.length || keys.some((key) => typeof key !== "string" || !expected.includes(key))) {
    throw new TypeError(`Source qualification result ${index} fields are invalid`);
  }
  const values = Object.create(null);
  for (const key of expected) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(entry, key); }
    catch { throw new TypeError(`Source qualification result ${index}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`Source qualification result ${index}.${key} must be an enumerable data field`);
    }
    values[key] = descriptor.value;
  }
  const subscription = Object.freeze(normalizeSubscription(values.subscription));
  const parsed = snapshotParsedPolicy(values.parsed, index, subscriptionSourceKey(subscription));
  const declaredBytes = values.declaredBytes;
  if (declaredBytes !== null && (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0)) {
    throw new TypeError(`Source qualification result ${index}.declaredBytes is invalid`);
  }
  return Object.freeze({ subscription, parsed, declaredBytes });
}

export function snapshotSourceQualificationResults(results) {
  let prototype;
  let keys;
  let lengthDescriptor;
  try {
    if (!Array.isArray(results)) throw new TypeError();
    prototype = Object.getPrototypeOf(results);
    keys = Reflect.ownKeys(results);
    lengthDescriptor = Object.getOwnPropertyDescriptor(results, "length");
  } catch { throw new TypeError("Source qualification results must be a standard dense array"); }
  if (prototype !== Array.prototype || !lengthDescriptor || !("value" in lengthDescriptor)) {
    throw new TypeError("Source qualification results must be a standard dense array");
  }
  const length = lengthDescriptor.value;
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_SOURCE_QUALIFICATION_RESULTS || keys.length !== length + 1 || !keys.includes("length")) {
    throw new TypeError("Source qualification results length is invalid");
  }
  const snapshot = [];
  const seenIds = new Set();
  const seenSourceKeys = new Set();
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(results, String(index)); }
    catch { throw new TypeError(`Source qualification results[${index}] is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError("Source qualification results must not contain holes or accessors");
    }
    const result = exactResultEntry(descriptor.value, index);
    const id = result.subscription.id;
    const sourceKey = result.parsed.sourceKey;
    if (seenIds.has(id)) throw new TypeError(`Source qualification results contain duplicate id: ${id}`);
    if (seenSourceKeys.has(sourceKey)) throw new TypeError("Source qualification results contain duplicate source identity");
    seenIds.add(id);
    seenSourceKeys.add(sourceKey);
    snapshot.push(result);
  }
  return Object.freeze(snapshot);
}
