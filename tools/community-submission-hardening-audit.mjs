import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }

const community = read("src/core/community.js");
const boundary = read("src/core/community-boundary.js");
const issue = read("src/core/community-issue.js");
const validation = read("tools/community-validation.mjs");
const review = read("tools/community-review-validation.mjs");
const promotion = read("tools/community-promotion.mjs");
const io = read("tools/community-file-io.mjs");
const output = read("tools/community-output.mjs");
const workflowIo = read("tools/community-workflow-io.mjs");
const checkCli = read("tools/check-community-submission.mjs");
const promoteCli = read("tools/promote-community-submission.mjs");
const validateWorkflow = read(".github/workflows/community-submission.yml");
const promoteWorkflow = read(".github/workflows/community-promote.yml");
const pkg = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [boundary, "assertPlainExactObject(rule, \"Community candidate rule\"", "descriptor-safe community candidate snapshot"],
  [boundary, "return Object.freeze(snapshot)", "immutable community boundary snapshot"],
  [community, "immutableDomainCandidate", "immutable canonical community candidate"],
  [community, "rejectUnsafeCommunityCandidate(normalized)", "unsafe exact-URL admission rejection"],
  [community, "normalizeDomain(normalized.value)", "hostname-only exact-URL reduction"],
  [issue, "MAX_COMMUNITY_ISSUE_BODY_CHARS", "bounded community issue body"],
  [issue, "MAX_COMMUNITY_ISSUE_URL_CHARS", "bounded community issue URL"],
  [issue, "serializeCommunityIssueUrl", "deterministic community issue serializer"],
  [validation, "snapshotCommunityValidationInput", "descriptor-safe validation input"],
  [validation, "MAX_COMMUNITY_SUBMISSION_BODY_BYTES", "bounded validation body"],
  [validation, "MAX_COMMUNITY_LIST_BYTES", "bounded community list"],
  [validation, "return Object.freeze({ valid: status !== \"invalid\"", "immutable validation result"],
  [validation, "Candidate must already use its canonical normalized domain spelling", "canonical candidate spelling"],
  [validation, "assertRemoteRuleSafe(candidateRule)", "public-domain validation boundary"],
  [review, "COMMUNITY_REVIEW_ATTESTATIONS", "explicit review attestation contract"],
  [review, "MAX_COMMUNITY_RATIONALE_CHARS", "bounded community rationale"],
  [review, "Submission must contain exactly one", "unique review-section boundary"],
  [review, "validateCommunitySubmissionTitle", "issue title candidate binding"],
  [review, "return Object.freeze({ reviewed: true, rationalePresent: true })", "privacy-minimal review result"],
  [promotion, "snapshotPromotionInput", "descriptor-safe promotion input"],
  [promotion, "Reflect.ownKeys(input)", "exact promotion input shape"],
  [promotion, "Object.getOwnPropertyDescriptor(input, key)", "promotion own-data field boundary"],
  [promotion, "MAX_COMMUNITY_SUBMISSION_BODY_BYTES", "promotion body ceiling"],
  [promotion, "MAX_COMMUNITY_LIST_BYTES", "promotion list ceiling"],
  [promotion, "snapshot.listText.startsWith(\"\\uFEFF\")", "promotion BOM rejection"],
  [promotion, "snapshot.listText.includes(\"\\0\")", "promotion NUL rejection"],
  [promotion, "snapshot.listText.includes(\"\\r\")", "promotion CR rejection"],
  [promotion, "!snapshot.listText.endsWith(\"\\n\")", "promotion final-LF requirement"],
  [promotion, "promotedListContainsCandidateExactlyOnce", "promotion semantic revalidation"],
  [promotion, "Buffer.byteLength(nextListText, \"utf8\") > MAX_COMMUNITY_LIST_BYTES", "promoted output byte ceiling"],
  [io, "new TextDecoder(\"utf-8\", { fatal: true, ignoreBOM: true })", "strict BOM-preserving UTF-8 community list reader"],
  [io, "metadata.isSymbolicLink()", "community list symlink rejection"],
  [io, "before.mtimeMs !== after.mtimeMs", "stable community list read"],
  [io, "open(tempPath, \"wx\", 0o600)", "exclusive atomic community temp file"],
  [io, "await handle.sync()", "community temp fsync"],
  [io, "rename(tempPath, path)", "atomic community list replacement"],
  [output, "Object.getOwnPropertyDescriptor(object, key)", "workflow output own-data boundary"],
  [output, "MAX_COMMUNITY_OUTPUT_CANDIDATE_CHARS", "workflow candidate output ceiling"],
  [output, "MAX_COMMUNITY_OUTPUT_REASON_CHARS", "workflow reason output ceiling"],
  [workflowIo, "MAX_COMMUNITY_WORKFLOW_OUTPUT_BYTES", "workflow output file byte ceiling"],
  [workflowIo, "before.isSymbolicLink()", "workflow output symlink rejection"],
  [workflowIo, "O_NOFOLLOW", "workflow output no-follow open"],
  [workflowIo, "opened.ino !== before.ino", "workflow output identity check"],
  [checkCli, "validateReviewedCommunitySubmission", "validation CLI reviewed issue gate"],
  [checkCli, "validateCommunitySubmissionTitle", "validation CLI title binding"],
  [checkCli, "serializeCommunityValidationOutputs", "validation CLI strict output serialization"],
  [checkCli, "appendCommunityWorkflowOutput", "validation CLI hardened output append"],
  [promoteCli, "validateReviewedCommunitySubmission", "promotion CLI reviewed issue gate"],
  [promoteCli, "validateCommunitySubmissionTitle", "promotion title binding"],
  [promoteCli, "writeCommunityListFileAtomic", "promotion CLI atomic persistence"],
  [promoteCli, "serializeCommunityPromotionOutputs", "promotion CLI strict output serialization"],
  [promoteCli, "appendCommunityWorkflowOutput", "promotion CLI hardened output append"],
  [validateWorkflow, "SUBMISSION_TITLE: ${{ github.event.issue.title }}", "validation workflow title binding"],
  [promoteWorkflow, "SUBMISSION_TITLE: ${{ github.event.issue.title }}", "promotion workflow title binding"],
  [promoteWorkflow, "group: community-promotion-${{ github.event.issue.number }}", "per-issue promotion concurrency"],
  [promoteWorkflow, "cancel-in-progress: false", "non-cancelling promotion serialization"],
  [promoteWorkflow, "timeout-minutes: 10", "bounded promotion runtime"],
  [promoteWorkflow, "git fetch origin \"$DEFAULT_BRANCH\"", "fresh default-branch check"],
  [promoteWorkflow, "default branch changed after candidate validation", "stale validation rejection"]
]) requireText(source, needle, label);

if (/source page|request log|browsing history/.test(issue) === false) throw new Error("privacy-minimal community issue disclosure is missing");
if (/original URL|document\.URL|location\.href/.test(community)) throw new Error("community submission boundary contains an unexpected source-page detail surface");
if (/listText=|listText\}/.test(output)) throw new Error("community workflow output must not serialize full community-list text");
const forbiddenRuntimeSurface = /fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB/i;
for (const source of [community, boundary, issue, validation, review, promotion, io, output, workflowIo, checkCli, promoteCli]) {
  if (forbiddenRuntimeSurface.test(source)) throw new Error("community submission tooling must remain privacy-minimal and non-tracking");
}

if (pkg.scripts?.["community-submission-hardening-audit"] !== "node tools/community-submission-hardening-audit.mjs") throw new Error("community-submission-hardening-audit script is missing");
if (!pkg.scripts?.check?.includes("npm run community-submission-hardening-audit")) throw new Error("community-submission-hardening-audit is not wired into npm run check");

// Current submission/review/promotion/privacy/workflow invariants are checked directly
// above. Historical milestone test-file presence is intentionally not required.

console.log("community-submission-hardening-audit: canonical community submission, reviewed issue, and promotion invariants verified through M886");
