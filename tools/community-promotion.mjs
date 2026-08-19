import { parseNativeList } from "../src/core/lists.js";
import { ruleKey } from "../src/core/rules.js";
import {
  MAX_COMMUNITY_LIST_BYTES,
  MAX_COMMUNITY_SUBMISSION_BODY_BYTES,
  validateCommunitySubmission
} from "./community-validation.mjs";

const PROMOTION_INPUT_KEYS = new Set(["body", "listText"]);

function snapshotPromotionInput(input) {
  let prototype;
  let keys;
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError();
    prototype = Object.getPrototypeOf(input);
    keys = Reflect.ownKeys(input);
  } catch {
    throw new TypeError("Community promotion input must be a plain own-data object");
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError("Community promotion input must be a plain own-data object");
  if (keys.length !== PROMOTION_INPUT_KEYS.size || keys.some((key) => typeof key !== "string" || !PROMOTION_INPUT_KEYS.has(key))) {
    throw new TypeError("Community promotion input has unexpected fields");
  }
  const snapshot = Object.create(null);
  for (const key of ["body", "listText"]) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(input, key); }
    catch { throw new TypeError(`Community promotion ${key} is not safely inspectable`); }
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor) || typeof descriptor.value !== "string") {
      throw new TypeError(`Community promotion ${key} must be an enumerable own text field`);
    }
    snapshot[key] = descriptor.value;
  }
  if (Buffer.byteLength(snapshot.body, "utf8") > MAX_COMMUNITY_SUBMISSION_BODY_BYTES) throw new Error("Community promotion body is too large");
  if (Buffer.byteLength(snapshot.listText, "utf8") > MAX_COMMUNITY_LIST_BYTES) throw new Error("Community promotion list is too large");
  if (snapshot.listText.startsWith("\uFEFF")) throw new Error("Community promotion list must not contain a UTF-8 BOM");
  if (snapshot.listText.includes("\0")) throw new Error("Community promotion list must not contain NUL bytes");
  if (snapshot.listText.includes("\r")) throw new Error("Community promotion list must use LF line endings");
  if (snapshot.listText.length > 0 && !snapshot.listText.endsWith("\n")) throw new Error("Community promotion list must end with LF");
  return Object.freeze(snapshot);
}

function promotionResult(validation, changed, listText) {
  return Object.freeze({
    valid: validation.valid,
    status: validation.status,
    candidate: validation.candidate,
    reason: validation.reason,
    changed,
    listText
  });
}

function promotedListContainsCandidateExactlyOnce(listText, candidateLine) {
  const candidate = parseNativeList(candidateLine).block[0];
  if (!candidate || candidate.kind !== "domain") return false;
  const key = ruleKey(candidate);
  const parsed = parseNativeList(listText);
  return parsed.block.filter((rule) => ruleKey(rule) === key).length === 1;
}

export function promoteCommunitySubmission(input) {
  let snapshot;
  try {
    snapshot = snapshotPromotionInput(input);
  } catch {
    return Object.freeze({
      valid: false,
      status: "invalid",
      candidate: "",
      reason: "Community promotion input is invalid",
      changed: false,
      listText: ""
    });
  }

  const validation = validateCommunitySubmission(snapshot);
  if (validation.status !== "ready") return promotionResult(validation, false, snapshot.listText);

  const base = snapshot.listText.replace(/\n+$/, "");
  const nextListText = `${base}${base ? "\n" : ""}${validation.candidate}\n`;
  if (Buffer.byteLength(nextListText, "utf8") > MAX_COMMUNITY_LIST_BYTES) {
    return Object.freeze({
      valid: false,
      status: "invalid",
      candidate: "",
      reason: "Promoted community list would exceed the supported size limit",
      changed: false,
      listText: snapshot.listText
    });
  }
  if (!promotedListContainsCandidateExactlyOnce(nextListText, validation.candidate)) {
    return Object.freeze({
      valid: false,
      status: "invalid",
      candidate: "",
      reason: "Promoted community list failed semantic revalidation",
      changed: false,
      listText: snapshot.listText
    });
  }
  return promotionResult(validation, true, nextListText);
}
