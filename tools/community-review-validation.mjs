import { MAX_COMMUNITY_SUBMISSION_BODY_BYTES, validateCommunitySubmission } from "./community-validation.mjs";

export const COMMUNITY_REVIEW_ATTESTATIONS = Object.freeze([
  "I reviewed the candidate domain before submitting.",
  "This is a domain-only submission and contains no page, path, query, fragment, or account data."
]);
export const MIN_COMMUNITY_RATIONALE_CHARS = 8;
export const MAX_COMMUNITY_RATIONALE_CHARS = 1_000;
const REVIEW_HEADING = "## Review";
const RATIONALE_HEADING = "## Why block this?";
const PRIVACY_HEADING = "## Privacy note";

function countExact(lines, value) {
  let count = 0;
  for (const line of lines) if (line === value) count += 1;
  return count;
}

function singleIndex(lines, value, label) {
  if (countExact(lines, value) !== 1) throw new Error(`Submission must contain exactly one ${label} section`);
  return lines.indexOf(value);
}

function validateAttestations(lines, reviewIndex, rationaleIndex) {
  const reviewLines = lines.slice(reviewIndex + 1, rationaleIndex);
  for (const statement of COMMUNITY_REVIEW_ATTESTATIONS) {
    let checked = 0;
    let any = 0;
    for (const line of reviewLines) {
      if (line === `- [x] ${statement}` || line === `- [X] ${statement}`) checked += 1;
      if (line === `- [ ] ${statement}` || line === `- [x] ${statement}` || line === `- [X] ${statement}`) any += 1;
    }
    if (checked !== 1 || any !== 1) throw new Error("Submission review attestations are incomplete or malformed");
  }
}

function validateRationale(lines, rationaleIndex, privacyIndex) {
  const rationaleLines = lines.slice(rationaleIndex + 1, privacyIndex);
  if (rationaleLines.some((line) => /<!--|-->/.test(line))) throw new Error("Submission rationale must replace the template comment with a human reason");
  const rationale = rationaleLines.join("\n").trim();
  if (rationale.length < MIN_COMMUNITY_RATIONALE_CHARS || rationale.length > MAX_COMMUNITY_RATIONALE_CHARS) {
    throw new Error("Submission rationale must contain a brief bounded human reason");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(rationale)) throw new Error("Submission rationale contains unsupported control characters");
}

export function validateCommunityReviewBody(body) {
  if (typeof body !== "string") throw new TypeError("Community review body must be text");
  if (Buffer.byteLength(body, "utf8") > MAX_COMMUNITY_SUBMISSION_BODY_BYTES) throw new Error("Submission body is too large");
  const lines = body.split(/\r?\n/);
  const reviewIndex = singleIndex(lines, REVIEW_HEADING, "Review");
  const rationaleIndex = singleIndex(lines, RATIONALE_HEADING, "Why block this?");
  const privacyIndex = singleIndex(lines, PRIVACY_HEADING, "Privacy note");
  if (!(reviewIndex < rationaleIndex && rationaleIndex < privacyIndex)) throw new Error("Submission review sections are out of order");
  validateAttestations(lines, reviewIndex, rationaleIndex);
  validateRationale(lines, rationaleIndex, privacyIndex);
  return Object.freeze({ reviewed: true, rationalePresent: true });
}

export function validateCommunitySubmissionTitle(title, candidate) {
  if (typeof title !== "string" || typeof candidate !== "string") return false;
  if (!candidate.startsWith("block domain ")) return false;
  const domain = candidate.slice("block domain ".length);
  return title === `[Community block] ${domain}`;
}

export function validateReviewedCommunitySubmission(input) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(input, "body");
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") throw new TypeError("Community review body must be an own data field");
    validateCommunityReviewBody(descriptor.value);
  } catch (error) {
    return Object.freeze({
      valid: false,
      status: "invalid",
      candidate: "",
      reason: (error instanceof Error ? error.message : "Submission review is invalid").replace(/[\r\n]+/g, " ").slice(0, 1_024)
    });
  }
  return validateCommunitySubmission(input);
}
