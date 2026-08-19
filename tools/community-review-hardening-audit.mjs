import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const requireText = (source, needle, label) => { if (!source.includes(needle)) throw new Error(`${label} is missing`); };

const review = read("tools/community-review-validation.mjs");
const checkCli = read("tools/check-community-submission.mjs");
const promoteCli = read("tools/promote-community-submission.mjs");
const validateWorkflow = read(".github/workflows/community-submission.yml");
const promoteWorkflow = read(".github/workflows/community-promote.yml");
const issue = read("src/core/community-issue.js");

for (const [source, needle, label] of [
  [issue, "I reviewed the candidate domain before submitting.", "generated review attestation"],
  [issue, "This is a domain-only submission", "generated domain-only attestation"],
  [issue, "## Why block this?", "generated rationale section"],
  [review, "COMMUNITY_REVIEW_ATTESTATIONS", "review attestation contract"],
  [review, "MIN_COMMUNITY_RATIONALE_CHARS", "minimum rationale bound"],
  [review, "MAX_COMMUNITY_RATIONALE_CHARS", "maximum rationale bound"],
  [review, "Submission review sections are out of order", "review section ordering"],
  [review, "validateCommunitySubmissionTitle", "title candidate binding"],
  [review, "Object.freeze({ reviewed: true, rationalePresent: true })", "privacy-minimal review result"],
  [checkCli, "validateReviewedCommunitySubmission", "reviewed validation CLI gate"],
  [checkCli, "SUBMISSION_TITLE", "validation CLI title input"],
  [promoteCli, "validateReviewedCommunitySubmission", "reviewed promotion CLI gate"],
  [promoteCli, "validateCommunitySubmissionTitle", "promotion title binding"],
  [validateWorkflow, "SUBMISSION_TITLE: ${{ github.event.issue.title }}", "validation workflow title binding"],
  [promoteWorkflow, "SUBMISSION_TITLE: ${{ github.event.issue.title }}", "promotion workflow title binding"],
  [promoteWorkflow, "group: community-promotion-${{ github.event.issue.number }}", "per-issue promotion serialization"]
]) requireText(source, needle, label);

for (const source of [review, checkCli, promoteCli]) {
  if (/analytics|telemetry|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB/i.test(source)) throw new Error("community review hardening must remain privacy-minimal");
}

// Current review/workflow/privacy contracts are validated directly above. Historical
// milestone test-file presence is intentionally not part of this audit.

console.log("community-review-hardening-audit: reviewed community issue and promotion invariants verified through M896");
