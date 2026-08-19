import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const MAX_REMOTE_LIST_TEXT_CHARS = 5_000_000;
export const MAX_REMOTE_LIST_LINES = 300_000;
export const MAX_REMOTE_LIST_LINE_CHARS = 16_384;
export const MAX_REMOTE_SUPPORTED_RULES = 300_000;

const PARSED_NETWORK_KEYS = new Set(["block", "allow", "unsupportedCount"]);
const PARSED_COSMETIC_KEYS = new Set(["hide", "allow", "unsupportedCount"]);
const TEXT_STRUCTURE_OPTION_KEYS = new Set(["maxLines", "maxLineChars"]);

function positiveSafeIntegerWithin(value, label, ceiling) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > ceiling) {
    throw new Error(`${label} must be a positive safe integer no greater than ${ceiling}`);
  }
  return value;
}

function assertUnsupportedCount(value, label) {
  if (value == null) return;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}.unsupportedCount must be a non-negative safe integer`);
}

function parsedPolicySnapshot(value, label, allowedKeys) {
  assertPlainExactObject(value, label, allowedKeys);
  const snapshot = Object.create(null);
  for (const key of allowedKeys) {
    const field = readPlainDataField(value, key);
    if (!field.safe) throw new Error(`${label}.${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  return snapshot;
}

function ruleArrayCount(object, key, label, maxRules) {
  if (!Object.hasOwn(object, key) || object[key] == null) return 0;
  return snapshotDenseDataArray(object[key], `${label}.${key}`, maxRules).length;
}

function structureOption(options, key, fallback, label, ceiling) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new Error(`Remote list structure option ${key} must be an own enumerable data field when present`);
  return field.present ? positiveSafeIntegerWithin(field.value, label, ceiling) : fallback;
}

export function assertRemoteListTextStructure(text, options = {}) {
  if (typeof text !== "string") throw new TypeError("Remote filter list must be text");
  if (text.length > MAX_REMOTE_LIST_TEXT_CHARS) {
    throw new Error(`Remote filter list exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`);
  }
  assertPlainExactObject(options, "Remote list structure options", TEXT_STRUCTURE_OPTION_KEYS);

  const maxLines = structureOption(
    options,
    "maxLines",
    MAX_REMOTE_LIST_LINES,
    "Remote list line limit",
    MAX_REMOTE_LIST_LINES
  );
  const maxLineChars = structureOption(
    options,
    "maxLineChars",
    MAX_REMOTE_LIST_LINE_CHARS,
    "Remote list line-length limit",
    MAX_REMOTE_LIST_LINE_CHARS
  );

  let lines = 1;
  let currentLineChars = 0;
  let longestLineChars = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      longestLineChars = Math.max(longestLineChars, currentLineChars);
      if (currentLineChars > maxLineChars) throw new Error("Remote list contains an excessively long line");
      currentLineChars = 0;
      lines += 1;
      if (lines > maxLines) throw new Error("Remote list contains too many lines");
      continue;
    }
    currentLineChars += 1;
    if (currentLineChars > maxLineChars) throw new Error("Remote list contains an excessively long line");
  }
  longestLineChars = Math.max(longestLineChars, currentLineChars);

  return { lines, longestLineChars };
}

export function assertRemoteSupportedRuleCount(parsed, cosmetic, maxRules = MAX_REMOTE_SUPPORTED_RULES) {
  positiveSafeIntegerWithin(maxRules, "Remote supported-rule limit", MAX_REMOTE_SUPPORTED_RULES);
  const network = parsedPolicySnapshot(parsed, "Parsed network policy", PARSED_NETWORK_KEYS);
  const cosmetics = parsedPolicySnapshot(cosmetic, "Parsed cosmetic policy", PARSED_COSMETIC_KEYS);
  assertUnsupportedCount(network.unsupportedCount, "Parsed network policy");
  assertUnsupportedCount(cosmetics.unsupportedCount, "Parsed cosmetic policy");

  const counts = [
    ruleArrayCount(network, "block", "Parsed network policy", maxRules),
    ruleArrayCount(network, "allow", "Parsed network policy", maxRules),
    ruleArrayCount(cosmetics, "hide", "Parsed cosmetic policy", maxRules),
    ruleArrayCount(cosmetics, "allow", "Parsed cosmetic policy", maxRules)
  ];
  const supported = counts.reduce((sum, count) => sum + count, 0);
  if (supported > maxRules) throw new Error("Remote list contains too many supported rules");
  return supported;
}
