import { assertRemoteRuleSafe, parseNativeList } from "../src/core/lists.js";
import { ruleKey } from "../src/core/rules.js";

export const MAX_COMMUNITY_SUBMISSION_BODY_BYTES = 64 * 1024;
export const MAX_COMMUNITY_LIST_BYTES = 4 * 1024 * 1024;
export const MAX_COMMUNITY_RESULT_REASON_CHARS = 1_024;
const COMMUNITY_RESULT_STATUSES = new Set(["invalid", "duplicate", "covered", "conflict", "ready"]);
const CANDIDATE_BLOCK = /```text\s*\r?\n(block domain ([^\r\n]+))\s*\r?\n```/gi;

export function snapshotCommunityValidationInput(input) {
  let prototype;
  let keys;
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError();
    prototype = Object.getPrototypeOf(input);
    keys = Reflect.ownKeys(input);
  } catch {
    throw new TypeError("Community validation input must be a plain own-data object");
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError("Community validation input must be a plain own-data object");
  if (keys.length !== 2 || keys.some((key) => typeof key !== "string" || (key !== "body" && key !== "listText"))) {
    throw new TypeError("Community validation input has unexpected fields");
  }
  const snapshot = Object.create(null);
  for (const key of ["body", "listText"]) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(input, key); }
    catch { throw new TypeError(`Community validation ${key} is not safely inspectable`); }
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError(`Community validation ${key} must be an enumerable own data field`);
    }
    if (typeof descriptor.value !== "string") throw new TypeError(`Community validation ${key} must be text`);
    snapshot[key] = descriptor.value;
  }
  if (Buffer.byteLength(snapshot.body, "utf8") > MAX_COMMUNITY_SUBMISSION_BODY_BYTES) throw new Error("Submission body is too large");
  if (Buffer.byteLength(snapshot.listText, "utf8") > MAX_COMMUNITY_LIST_BYTES) throw new Error("Community list is too large");
  return Object.freeze(snapshot);
}

function extractSingleCandidateBlock(body) {
  CANDIDATE_BLOCK.lastIndex = 0;
  const first = CANDIDATE_BLOCK.exec(body);
  if (!first) throw new Error("Submission must contain exactly one block-domain candidate");
  const second = CANDIDATE_BLOCK.exec(body);
  CANDIDATE_BLOCK.lastIndex = 0;
  if (second) throw new Error("Submission must contain exactly one block-domain candidate");
  return first;
}

function result(status, candidate = "", reason = "") {
  if (!COMMUNITY_RESULT_STATUSES.has(status)) throw new TypeError("Community validation status is invalid");
  const safeCandidate = typeof candidate === "string" ? candidate : "";
  const safeReason = (typeof reason === "string" ? reason : "Submission is invalid")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, MAX_COMMUNITY_RESULT_REASON_CHARS);
  return Object.freeze({ valid: status !== "invalid", status, candidate: safeCandidate, reason: safeReason });
}

function isSameOrSubdomain(candidate, parent) {
  return candidate === parent || candidate.endsWith(`.${parent}`);
}

function bareDomainInput(value) {
  const trimmed = String(value).trim();
  if (!trimmed || /[:/?#@|^*\\]/.test(trimmed)) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(trimmed)
    || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(trimmed);
}

export function classifyCommunityCandidate(candidateRule, current) {
  const candidateKey = ruleKey(candidateRule);
  for (const rule of current.block) {
    if (ruleKey(rule) === candidateKey) return { status: "duplicate", rule };
  }
  for (const rule of current.block) {
    if (rule.kind === "domain" && isSameOrSubdomain(candidateRule.value, rule.value)) return { status: "covered", rule };
  }
  for (const rule of current.allow) {
    if (rule.kind === "domain" && isSameOrSubdomain(candidateRule.value, rule.value)) return { status: "conflict", rule };
  }
  return { status: "ready", rule: null };
}

export function validateCommunitySubmission(input) {
  try {
    const { body, listText } = snapshotCommunityValidationInput(input);
    const match = extractSingleCandidateBlock(body);
    const [, candidateLine, rawValue] = match;
    const rawCandidate = rawValue.trim();
    if (!bareDomainInput(rawCandidate)) throw new Error("Candidate must be a bare domain only; URLs, paths, queries, fragments, filter syntax, and credentials are rejected");

    const parsedCandidate = parseNativeList(candidateLine);
    if (parsedCandidate.block.length !== 1 || parsedCandidate.allow.length !== 0 || parsedCandidate.block[0].kind !== "domain") {
      throw new Error("Candidate must be exactly one block-domain rule");
    }

    const candidateRule = parsedCandidate.block[0];
    if (candidateRule.value !== rawCandidate) throw new Error("Candidate must already use its canonical normalized domain spelling");
    try {
      assertRemoteRuleSafe(candidateRule);
    } catch {
      throw new Error("Candidate must target a public domain; local, private, reserved, and non-public network targets are rejected");
    }
    const candidate = `block domain ${candidateRule.value}`;
    const current = parseNativeList(listText);
    const classification = classifyCommunityCandidate(candidateRule, current);

    if (classification.status === "duplicate") return result("duplicate", candidate, "Candidate already exists in the community block list");
    if (classification.status === "covered") return result("covered", candidate, "Candidate is already covered by an existing community block rule");
    if (classification.status === "conflict") return result("conflict", candidate, "Candidate conflicts with an existing community allow rule");
    return result("ready", candidate, "Candidate is normalized, public, not redundant, and has no covering community allow rule");
  } catch (error) {
    CANDIDATE_BLOCK.lastIndex = 0;
    return result("invalid", "", error instanceof Error ? error.message : "Submission is invalid");
  }
}
