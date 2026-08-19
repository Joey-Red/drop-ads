import { assertRemoteRuleSafe } from "./lists.js";
import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";
import { normalizeDomain } from "./rules.js";

export const COMMUNITY_ISSUE_BASE = "https://github.com/Joey-Red/drop-ads/issues/new";
export const MAX_COMMUNITY_ISSUE_TITLE_CHARS = 320;
export const MAX_COMMUNITY_ISSUE_BODY_CHARS = 2_048;
export const MAX_COMMUNITY_ISSUE_URL_CHARS = 8_192;
const COMMUNITY_CANDIDATE_KEYS = new Set(["kind", "value"]);
const COMMUNITY_ISSUE_FIELD_KEYS = new Set(["title", "body"]);

function requireBoundedText(value, label, maxChars) {
  if (typeof value !== "string" || !value || value.length > maxChars || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function snapshotCommunityCandidate(candidate) {
  assertPlainExactObject(candidate, "Community issue candidate", COMMUNITY_CANDIDATE_KEYS);
  const kind = readPlainDataField(candidate, "kind");
  const value = readPlainDataField(candidate, "value");
  if (!kind.safe || !kind.present || !value.safe || !value.present) throw new TypeError("Community issue candidate fields must be own enumerable data fields");
  if (kind.value !== "domain" || typeof value.value !== "string" || !value.value) throw new Error("Community issue candidate must be a canonical domain candidate");
  if (value.value.startsWith(".")) throw new Error("Community issue candidate domain must already be canonical");
  const domain = normalizeDomain(value.value);
  if (domain !== value.value) throw new Error("Community issue candidate domain must already be canonical");
  const safe = assertRemoteRuleSafe(Object.freeze({ kind: "domain", value: domain }));
  if (safe.kind !== "domain" || safe.value !== domain) throw new Error("Community issue candidate must be a public canonical domain");
  return Object.freeze({ kind: "domain", value: domain });
}

function snapshotCommunityIssueFields(fields) {
  assertPlainExactObject(fields, "Community issue fields", COMMUNITY_ISSUE_FIELD_KEYS);
  const title = readPlainDataField(fields, "title");
  const body = readPlainDataField(fields, "body");
  if (!title.safe || !title.present || !body.safe || !body.present) throw new TypeError("Community issue fields must be own enumerable data fields");
  return Object.freeze({
    title: requireBoundedText(title.value, "Community issue title", MAX_COMMUNITY_ISSUE_TITLE_CHARS),
    body: requireBoundedText(body.value, "Community issue body", MAX_COMMUNITY_ISSUE_BODY_CHARS)
  });
}

export function buildCommunityIssueFields(candidate) {
  const snapshot = snapshotCommunityCandidate(candidate);
  const domain = snapshot.value;
  const line = `block domain ${domain}`;
  const title = requireBoundedText(`[Community block] ${domain}`, "Community issue title", MAX_COMMUNITY_ISSUE_TITLE_CHARS);
  const body = requireBoundedText([
    "## Candidate", "", "```text", line, "```", "",
    "## Review", "",
    "- [ ] I reviewed the candidate domain before submitting.",
    "- [ ] This is a domain-only submission and contains no page, path, query, fragment, or account data.",
    "", "## Why block this?", "",
    "<!-- Briefly explain why this domain should be blocked. Remove this comment and add a reason before submitting. -->",
    "", "## Privacy note", "",
    "This submission was prepared locally by Drop Ads. It contains only the normalized candidate domain; no browsing history, source page, request log, analytics, or user identifier is included.",
    "", "Please review the candidate, check both review boxes, and add a reason before submitting this GitHub issue."
  ].join("\n"), "Community issue body", MAX_COMMUNITY_ISSUE_BODY_CHARS);
  return Object.freeze({ title, body });
}

export function serializeCommunityIssueUrl(fields) {
  const snapshot = snapshotCommunityIssueFields(fields);
  const url = `${COMMUNITY_ISSUE_BASE}?title=${encodeURIComponent(snapshot.title)}&body=${encodeURIComponent(snapshot.body)}`;
  if (url.length > MAX_COMMUNITY_ISSUE_URL_CHARS) throw new Error("Community issue URL exceeds the supported length limit");
  return url;
}
