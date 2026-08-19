import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { GENERATED_VERIFICATION_GUIDANCE_CONTRACT } from "./generated-verification-audit-contract.mjs";
import { readGeneratedVerificationAuditSource } from "./generated-verification-audit-io.mjs";
import { GENERATED_VERIFICATION_AUDIT_LIMITS } from "./generated-verification-audit-limits.mjs";
import { snapshotGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-source-result.mjs";

const MAX_QUALIFICATION_GUIDANCE_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxQualificationGuidanceViolations;
const QUALIFICATION_GUIDANCE_MARKER = "canonical M1243 generated verification qualification guidance verified";
const REQUIRED_MARKERS = Object.freeze([
  "Issue #10 remains the authoritative browser-observation gate",
  "source-only preflight",
  "exact-head Chromium and Firefox",
  "exact commit being qualified",
  "sourceFingerprint",
  "64 lowercase hexadecimal characters",
  "Both browser child fingerprints exactly equal the paired shared fingerprint",
  "fails closed rather than returning success",
  "No result/preflight path records",
  "Do not treat repository tests, audits, fixtures, generated records, or this guide as a browser pass"
]);
const FORBIDDEN_SUCCESS_CLAIMS = Object.freeze([
  "Chromium qualification passed",
  "Firefox qualification passed",
  "browser qualification passed",
  "Issue #10 is complete"
]);

function recordQualificationGuidanceViolation(violations, value) {
  if (violations.length >= MAX_QUALIFICATION_GUIDANCE_VIOLATIONS) {
    throw new Error(`Generated verification qualification guidance audit exceeded its ${MAX_QUALIFICATION_GUIDANCE_VIOLATIONS}-violation diagnostic ceiling`);
  }
  violations.push(value);
}

export function freezeGeneratedVerificationQualificationGuidanceAuditResult(guide) {
  if (guide !== GENERATED_VERIFICATION_GUIDANCE_CONTRACT.path) {
    throw new Error("generated-verification qualification guidance result must use the canonical guide path");
  }
  return Object.freeze({ guide, marker: QUALIFICATION_GUIDANCE_MARKER });
}

export async function auditGeneratedVerificationQualificationGuidance(rootDirectory) {
  const root = resolve(rootDirectory);
  const { path, maxBytes } = GENERATED_VERIFICATION_GUIDANCE_CONTRACT;
  const snapshot = snapshotGeneratedVerificationAuditSourceResult(
    await readGeneratedVerificationAuditSource(root, path, maxBytes),
    "generated-verification qualification guidance source result"
  );
  const source = snapshot.source;
  const violations = [];
  for (const marker of REQUIRED_MARKERS) {
    if (!source.includes(marker)) recordQualificationGuidanceViolation(violations, `missing qualification guidance marker: ${marker}`);
  }
  for (const claim of FORBIDDEN_SUCCESS_CLAIMS) {
    if (source.includes(claim)) recordQualificationGuidanceViolation(violations, `qualification guidance contains forbidden browser-success claim: ${claim}`);
  }
  if (!/Chromium[^\n]*Firefox|Firefox[^\n]*Chromium/.test(source)) {
    recordQualificationGuidanceViolation(violations, "qualification guidance must bind Chromium and Firefox to the same exact-head workflow");
  }
  if (violations.length) {
    throw new Error("Generated verification qualification guidance audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  }
  return freezeGeneratedVerificationQualificationGuidanceAuditResult(path);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationQualificationGuidance(root)
    .then((result) => console.log(`Generated verification qualification guidance audit passed: ${result.marker}.`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
