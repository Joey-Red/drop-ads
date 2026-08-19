import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readGeneratedVerificationAuditSource } from "./generated-verification-audit-io.mjs";
import { GENERATED_VERIFICATION_AUDIT_LIMITS } from "./generated-verification-audit-limits.mjs";
import { snapshotGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-source-result.mjs";

const RESULT_SOURCE_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxResultSourceBytes;
const RESULT_REGRESSION_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxResultRegressionBytes;
const MAX_RESULT_CONTRACT_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxResultContractViolations;
const RESULT_CONTRACT_MARKER = "canonical M1238-M1239 generated verification result contracts verified";
const REQUIRED_SOURCE = "tools/build-output-verify.mjs";
const REQUIRED_MARKERS = Object.freeze([
  "function freezeVerificationBrowserResult(browser, sourceFingerprint, files)",
  "const frozenFiles = Object.freeze(",
  "return Object.freeze({ browser: target, sourceFingerprint: fingerprint, files: frozenFiles })",
  "function freezeVerificationPairResult(chromium, firefox, sourceFingerprint)",
  "return Object.freeze({ chromium, firefox, sourceFingerprint: fingerprint })",
  "SOURCE_FINGERPRINT_PATTERN = /^sha256:[0-9a-f]{64}$/",
  "function assertVerificationSourceFingerprint(value, label)",
  "must be canonical sha256:-prefixed lowercase SHA-256 text",
  "Browser verification results do not match the shared source fingerprint"
]);
const REQUIRED_REGRESSIONS = Object.freeze([
  "tests/build-output-verify-result-contract-v1238.test.js",
  "tests/build-output-verify-fingerprint-v1239.test.js"
]);

function recordResultContractViolation(violations, value) {
  if (violations.length >= MAX_RESULT_CONTRACT_VIOLATIONS) {
    throw new Error(`Generated verification result contract audit exceeded its ${MAX_RESULT_CONTRACT_VIOLATIONS}-violation diagnostic ceiling`);
  }
  violations.push(value);
}

export function freezeGeneratedVerificationResultContractAuditResult() {
  return Object.freeze({ marker: RESULT_CONTRACT_MARKER });
}

export async function auditGeneratedVerificationResultContract(rootDirectory) {
  const root = resolve(rootDirectory);
  const violations = [];
  let source = "";
  try {
    const snapshot = snapshotGeneratedVerificationAuditSourceResult(
      await readGeneratedVerificationAuditSource(root, REQUIRED_SOURCE, RESULT_SOURCE_MAX_BYTES),
      "generated-verification result-contract source result"
    );
    source = snapshot.source;
  } catch (error) {
    recordResultContractViolation(violations, `required generated-verification result source is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const marker of REQUIRED_MARKERS) {
    if (!source.includes(marker)) recordResultContractViolation(violations, `missing generated-verification result marker: ${marker}`);
  }
  for (const path of REQUIRED_REGRESSIONS) {
    try {
      snapshotGeneratedVerificationAuditSourceResult(
        await readGeneratedVerificationAuditSource(root, path, RESULT_REGRESSION_MAX_BYTES),
        `generated-verification result-contract regression ${path}`
      );
    }
    catch (error) { recordResultContractViolation(violations, `required generated-verification result regression is unavailable: ${path}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (violations.length) throw new Error("Generated verification result contract audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  return freezeGeneratedVerificationResultContractAuditResult();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationResultContract(root)
    .then((result) => console.log(`Generated verification result contract audit passed: ${result.marker}.`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
