import { MAX_COMMUNITY_LIST_BYTES } from "./community-validation.mjs";

const MAX_COMMUNITY_OUTPUT_CANDIDATE_CHARS = 512;
const MAX_COMMUNITY_OUTPUT_REASON_CHARS = 1_024;
const MAX_COMMUNITY_OUTPUT_VALUE_CHARS = 4_096;
const MAX_COMMUNITY_SERIALIZED_OUTPUT_BYTES = 16 * 1024;
const COMMUNITY_OUTPUT_STATUSES = new Set(["invalid", "duplicate", "covered", "conflict", "ready"]);
const VALIDATION_KEYS = new Set(["valid", "status", "candidate", "reason"]);
const PROMOTION_KEYS = new Set(["valid", "status", "candidate", "reason", "changed", "listText"]);

function exactOwnKeys(object, expected, label) {
  let prototype;
  let keys;
  try {
    if (!object || typeof object !== "object" || Array.isArray(object)) throw new TypeError();
    prototype = Object.getPrototypeOf(object);
    keys = Reflect.ownKeys(object);
  } catch {
    throw new TypeError(`${label} must be a plain own-data object`);
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain own-data object`);
  if (keys.length !== expected.size || keys.some((key) => typeof key !== "string" || !expected.has(key))) {
    throw new TypeError(`${label} has unexpected fields`);
  }
}

function ownDataValue(object, key) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
  catch { throw new TypeError(`Community output ${key} is not safely inspectable`); }
  if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) throw new TypeError(`Community output ${key} must be an own data field`);
  return descriptor.value;
}

function outputText(value, key, maxChars = MAX_COMMUNITY_OUTPUT_VALUE_CHARS) {
  if (typeof value !== "string" || value.length > Math.min(maxChars, MAX_COMMUNITY_OUTPUT_VALUE_CHARS) || /[\r\n\u0000]/.test(value)) {
    throw new Error(`Community output ${key} is invalid`);
  }
  return value;
}

function snapshotCommon(result) {
  const status = outputText(ownDataValue(result, "status"), "status", 16);
  if (!COMMUNITY_OUTPUT_STATUSES.has(status)) throw new Error("Community output status is invalid");
  const candidate = outputText(ownDataValue(result, "candidate"), "candidate", MAX_COMMUNITY_OUTPUT_CANDIDATE_CHARS);
  const reason = outputText(ownDataValue(result, "reason"), "reason", MAX_COMMUNITY_OUTPUT_REASON_CHARS);
  const valid = ownDataValue(result, "valid");
  if (typeof valid !== "boolean") throw new TypeError("Community output valid must be boolean");
  if ((status === "invalid") !== (valid === false)) throw new Error("Community output validity does not match status");
  if (status === "invalid" && candidate !== "") throw new Error("Invalid community output must not include a candidate");
  if (status !== "invalid" && !/^block domain [a-z0-9.-]+$/.test(candidate)) throw new Error("Community output candidate is invalid");
  return Object.freeze({ valid, status, candidate, reason });
}

function serializeOutputLines(lines) {
  const output = `${lines.join("\n")}\n`;
  if (Buffer.byteLength(output, "utf8") > MAX_COMMUNITY_SERIALIZED_OUTPUT_BYTES) {
    throw new Error("Community workflow output is too large");
  }
  return output;
}

function validatePromotionListText(listText, changed) {
  if (typeof listText !== "string" || Buffer.byteLength(listText, "utf8") > MAX_COMMUNITY_LIST_BYTES) {
    throw new TypeError("Community promotion listText is invalid");
  }
  if (!changed) return;
  if (listText.startsWith("\uFEFF") || listText.includes("\0") || listText.includes("\r") || !listText.endsWith("\n")) {
    throw new Error("Changed community promotion output must be canonical LF text");
  }
}

export function serializeCommunityValidationOutputs(result) {
  exactOwnKeys(result, VALIDATION_KEYS, "Community validation output");
  const common = snapshotCommon(result);
  return serializeOutputLines([
    `valid=${common.valid}`,
    `status=${common.status}`,
    `candidate=${common.candidate}`,
    `reason=${common.reason}`
  ]);
}

export function serializeCommunityPromotionOutputs(result) {
  exactOwnKeys(result, PROMOTION_KEYS, "Community promotion output");
  const common = snapshotCommon(result);
  const changed = ownDataValue(result, "changed");
  const listText = ownDataValue(result, "listText");
  if (typeof changed !== "boolean") throw new TypeError("Community output changed must be boolean");
  if (changed !== (common.status === "ready")) throw new Error("Community promotion changed state does not match status");
  validatePromotionListText(listText, changed);
  return serializeOutputLines([
    `changed=${changed}`,
    `status=${common.status}`,
    `candidate=${common.candidate}`,
    `reason=${common.reason}`
  ]);
}
