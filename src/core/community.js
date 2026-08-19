import { snapshotCommunityRuleInput } from "./community-boundary.js";
import { buildCommunityIssueFields, COMMUNITY_ISSUE_BASE, serializeCommunityIssueUrl } from "./community-issue.js";
import { assertRemoteRuleSafe } from "./lists.js";
import { normalizeDomain, normalizeRule } from "./rules.js";

export { COMMUNITY_ISSUE_BASE };

function rejectUnsafeCommunityCandidate(rule) {
  try { return assertRemoteRuleSafe(rule); }
  catch { throw new Error("Local/private network targets cannot be prepared for community submission"); }
}

function immutableDomainCandidate(rule) {
  const safe = rejectUnsafeCommunityCandidate(rule);
  return Object.freeze({ kind: "domain", value: safe.value });
}

function normalizedCommunityInput(rule) { return normalizeRule(snapshotCommunityRuleInput(rule)); }

export function isCommunityCandidateEligible(rule) {
  let normalized;
  try { normalized = normalizedCommunityInput(rule); }
  catch { return false; }
  return (normalized.kind === "domain" || normalized.kind === "url") && !(normalized.resourceTypes?.length);
}

export function communityCandidateFromRule(rule) {
  const normalized = normalizedCommunityInput(rule);
  if (normalized.resourceTypes?.length) throw new Error("Resource-scoped local policy is not eligible for community submission");
  if (normalized.kind === "domain") return immutableDomainCandidate({ kind: "domain", value: normalized.value });
  if (normalized.kind === "url") {
    rejectUnsafeCommunityCandidate(normalized);
    return immutableDomainCandidate({ kind: "domain", value: normalizeDomain(normalized.value) });
  }
  throw new Error("Only unscoped domain and exact-URL local blocks can be prepared for community submission");
}

export function buildCommunityIssueUrl(rule) {
  return serializeCommunityIssueUrl(buildCommunityIssueFields(communityCandidateFromRule(rule)));
}
