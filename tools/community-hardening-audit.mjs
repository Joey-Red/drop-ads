import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function rejectMatch(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} is forbidden`); }

const boundary = read("src/core/community-boundary.js");
const community = read("src/core/community.js");
const issue = read("src/core/community-issue.js");
const validation = read("tools/community-validation.mjs");
const promotion = read("tools/community-promotion.mjs");
const fileIo = read("tools/community-file-io.mjs");
const output = read("tools/community-output.mjs");
const checkCli = read("tools/check-community-submission.mjs");
const promoteCli = read("tools/promote-community-submission.mjs");
const pkg = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [boundary, 'assertPlainExactObject(rule, "Community candidate rule"', "community rule exact-object boundary"],
  [boundary, "return Object.freeze(snapshot)", "immutable community rule snapshot"],
  [community, "immutableDomainCandidate", "immutable domain-only candidate"],
  [community, "rejectUnsafeCommunityCandidate(normalized)", "public safety check before exact-URL reduction"],
  [community, "normalizeDomain(normalized.value)", "exact-URL domain-only reduction"],
  [issue, 'const COMMUNITY_CANDIDATE_KEYS = new Set(["kind", "value"])', "exact community issue candidate schema"],
  [issue, "domain !== value.value", "already-canonical issue domain admission"],
  [issue, "assertRemoteRuleSafe", "public candidate admission"],
  [issue, "MAX_COMMUNITY_ISSUE_URL_CHARS", "bounded issue URL"],
  [validation, "snapshotCommunityValidationInput", "descriptor-safe validation snapshot"],
  [validation, "MAX_COMMUNITY_SUBMISSION_BODY_BYTES", "submission body byte ceiling"],
  [validation, "MAX_COMMUNITY_LIST_BYTES", "community list byte ceiling"],
  [validation, "const second = CANDIDATE_BLOCK.exec(body)", "bounded duplicate candidate scan"],
  [validation, "assertRemoteRuleSafe(candidateRule)", "validator public-domain safety boundary"],
  [validation, 'return result("covered", candidate, "Candidate is already covered by an existing community block rule")', "privacy-minimal covered reason"],
  [validation, 'return result("conflict", candidate, "Candidate conflicts with an existing community allow rule")', "privacy-minimal conflict reason"],
  [validation, 'return Object.freeze({ valid: status !== "invalid"', "immutable validation result"],
  [promotion, "snapshotPromotionInput", "descriptor-safe promotion input"],
  [promotion, 'snapshot.listText.startsWith("\\uFEFF")', "promotion BOM rejection"],
  [promotion, 'snapshot.listText.includes("\\0")', "promotion NUL rejection"],
  [promotion, 'snapshot.listText.includes("\\r")', "promotion CR rejection"],
  [promotion, '!snapshot.listText.endsWith("\\n")', "promotion final-LF requirement"],
  [promotion, 'const nextListText = `${base}${base ? "\\n" : ""}${validation.candidate}\\n`', "deterministic promotion output"],
  [fileIo, 'new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })', "strict BOM-preserving UTF-8 community file read"],
  [fileIo, 'text.startsWith("\\uFEFF")', "community BOM rejection"],
  [fileIo, 'text.includes("\\0")', "community NUL rejection"],
  [fileIo, 'text.includes("\\r")', "community carriage-return rejection"],
  [fileIo, '!text.endsWith("\\n")', "community final-LF requirement"],
  [fileIo, 'open(tempPath, "wx", 0o600)', "exclusive community temp output"],
  [fileIo, "await handle.chmod(before.mode & 0o777)", "community mode preservation"],
  [fileIo, "await handle.sync()", "community output fsync"],
  [fileIo, "rename(tempPath, path)", "atomic community persistence"],
  [fileIo, "await syncParentDirectory(path)", "community parent-directory durability sync"],
  [output, "Object.getOwnPropertyDescriptor(object, key)", "strict workflow output own-data boundary"],
  [output, "MAX_COMMUNITY_OUTPUT_CANDIDATE_CHARS", "workflow candidate ceiling"],
  [output, "MAX_COMMUNITY_OUTPUT_REASON_CHARS", "workflow reason ceiling"],
  [output, "const VALIDATION_KEYS = new Set", "exact validation output schema"],
  [output, "const PROMOTION_KEYS = new Set", "exact promotion output schema"],
  [output, "COMMUNITY_OUTPUT_STATUSES.has(status)", "workflow status allowlist"],
  [checkCli, "serializeCommunityValidationOutputs", "validation CLI strict workflow output"],
  [promoteCli, "serializeCommunityPromotionOutputs", "promotion CLI strict workflow output"]
]) requireText(source, needle, label);

rejectMatch(promotion, /replace\(\/\\r\\n\/g/, "silent CRLF normalization in canonical promotion");
rejectMatch(community, /original URL|pathname|document\.URL|location\.href/, "source-page or exact-URL detail leakage");
const forbiddenRuntimeSurface = /fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB/i;
for (const source of [boundary, community, issue, validation, promotion, fileIo, output, checkCli, promoteCli]) {
  rejectMatch(source, forbiddenRuntimeSurface, "tracking or retained activity surface");
}

for (const script of ["community-submission-hardening-audit", "community-hardening-audit"]) {
  if (!pkg.scripts?.[script]) throw new Error(`${script} script is missing`);
  if (!pkg.scripts?.check?.includes(`npm run ${script}`)) throw new Error(`${script} is not wired into npm run check`);
}

// Current community contribution/privacy/IO invariants are validated directly above.
// Historical milestone test-file presence is intentionally not required by this audit.

console.log("community-hardening-audit: canonical community contribution invariants verified through M876");
