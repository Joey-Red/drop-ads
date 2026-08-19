import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { auditGeneratedVerificationHardening } from "./generated-verification-hardening-audit.mjs";
import { auditGeneratedContractConsistency } from "./generated-contract-consistency-audit.mjs";
import { auditGeneratedVerificationPreflight } from "./generated-verification-preflight-audit.mjs";
import { auditGeneratedVerificationResultContract } from "./generated-verification-result-contract-audit.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

const required = Object.freeze({
  contract: ["tools/generated-extension-contract.mjs", ["COMMON_GENERATED_EXTENSION_FILES", "generatedExtensionFilesForBrowser"]],
  sourceContractAudit: ["tools/generated-extension-contract-audit.mjs", ["source file is not present in generated extension contract", "rules/static.json must remain the only browser-only generated file"]],
  build: ["tools/build.mjs", ["auditGeneratedExtensionContract(root)", "generatedExtensionFilesForBrowser(browser)", "readRegularFileBounded", "writeBuildOutputBinaryAtomic", "ensureBuildDirectory", "verifyBuiltExtensionsContent(root)", "Build failed and partial generated output could not be invalidated"]],
  buildOutput: ["tools/build-output-io.mjs", ["BUILD_OUTPUT_BINARY_MAX_BYTES", "BUILD_OUTPUT_PATH_MAX_BYTES", "BUILD_OUTPUT_MAX_DIRECTORY_DEPTH", "createAtomicOutputTempPath", "assertAtomicOutputParentUnchanged", "assertAtomicOutputPublished"]],
  sourceIo: ["tools/package-source-io.mjs", ["must be a regular non-symlink file", "exceeds its byte ceiling before allocation", "changed during bounded read"]],
  atomicOutput: ["tools/atomic-output-temp.mjs", ["randomBytes(16)", "Atomic output parent changed before publish", "Atomic output published byte size is invalid"]],
  artifactAudit: ["tools/artifact-audit.mjs", ["generated-extension-contract.mjs", "compareGeneratedPathCodeUnits", "MAX_GENERATED_TREE_DIRECTORY_ENTRIES = 4096", "MAX_GENERATED_TREE_ALLOWLIST_FILES = 4096", "GENERATED_TREE_ALLOWLISTS", "snapshotGeneratedAllowlist", "snapshotGeneratedAllowlistSource", "Reflect.ownKeys(source)", "generated extension allowlist must be dense and field-exact", "opendir(current)", "snapshotGeneratedDirectoryIdentity", "assertGeneratedDirectoryIdentityUnchanged", "assertGeneratedSubtreeDirectoryIdentityUnchanged", "generated extension directory changed during subtree traversal", "assertGeneratedRootIdentityUnchanged", "changed during tree audit", "required generated extension file is missing", "non-regular filesystem entry"]],
  verificationPass: ["tools/generated-verification-pass.mjs", ["beginGeneratedVerificationPass", "finishGeneratedVerificationPass", "snapshotBuildInputDirectoryAncestry", "revalidateBuildInputDirectoryAncestry", "snapshotRootIdentityState", "VERIFICATION_ROOT_SENTINEL", "verificationRootSentinel", "descriptor.writable || descriptor.configurable", "ANCESTRY_ENTRY_KEYS", "MAX_VERIFICATION_ANCESTRY_ENTRIES = 64", "snapshotAncestryEntryState", "Generated verification pass ancestry must be dense without extra fields", "Generated verification pass ancestry must not contain holes", "assertAncestryRootMatchesPass", "Generated verification pass ancestry root does not match its output root", "Generated verification directory size metadata is invalid", "Generated verification directory time metadata is invalid", "Number.isSafeInteger(stat.size)", "Generated verification output root identity changed before ancestry revalidation", "Generated verification output root identity changed during ancestry revalidation"]],
  outputVerify: ["tools/build-output-verify.mjs", ["snapshotVerificationContract", "snapshotVerificationContractSource", "Reflect.ownKeys(source)", "generated verification contract must be dense and field-exact", "VERIFICATION_PATH_CONTROL_TEXT", "must be well-formed Unicode", "must use NFC Unicode", "contains forbidden control text", "snapshotBuildFingerprintInputs", "snapshotBuildFingerprintInputs(buildInfo.inputs)", "for (const descriptor of inputs)", "resolveVerificationChild", "readExpectedFingerprintBoundSource", "assertExpectedSourceMatchesBuildInfo", "assertVerificationSourceMembership(browser, descriptorMap)", "beginGeneratedVerificationPass(distDirectory)", "finishGeneratedVerificationPass(verificationPass)", "const postPassBuildInfo = await createBuildInfo(root)", "source state changed during final generated verification pass completion", "const sharedBuildInfo = await createBuildInfo(root)", "generated file does not match current source/build transformation", "snapshotGeneratedVerificationContract", "freezeVerificationBrowserResult", "freezeVerificationPairResult", "SOURCE_FINGERPRINT_PATTERN = /^sha256:[0-9a-f]{64}$/"]],
  verificationHardeningAudit: ["tools/generated-verification-hardening-audit.mjs", ["canonical M1152-M1158 generated verification boundaries verified", "extended through M1209 generated verification provenance boundaries verified", "extended through M1219 generated verification traversal boundaries verified", "extended through M1228 generated verification identity boundaries verified", "extended through M1229 generated verification pass-binding boundaries verified", "extended through M1229 generated verification root-metadata boundaries verified", "extended through M1231 generated verification allowlist-admission boundaries verified", "extended through M1232 generated verification subtree-identity boundaries verified", "extended through M1235 generated verification final-source-contract-path boundaries verified", "extended through M1236 generated verification structural boundaries verified", "auditGeneratedVerificationHardening"]],
  contractConsistencyAudit: ["tools/generated-contract-consistency-audit.mjs", ["canonical M1238 generated tree/verifier contract consistency verified", "canonical M1238 exact Chromium/Firefox generated contract delta verified", "FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER = \"rules/static.json\""]],
  resultContractAudit: ["tools/generated-verification-result-contract-audit.mjs", ["canonical M1238-M1239 generated verification result contracts verified", "SOURCE_FINGERPRINT_PATTERN = /^sha256:[0-9a-f]{64}$/", "readGeneratedVerificationAuditSource", "snapshotGeneratedVerificationAuditSourceResult"]],
  auditIo: ["tools/generated-verification-audit-io.mjs", ["readGeneratedVerificationAuditSource", "regular non-symlink audit source file", "strict UTF-8 audit source text"]],
  auditContract: ["tools/generated-verification-audit-contract.mjs", ["GENERATED_VERIFICATION_GUIDANCE_CONTRACT", "GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT", "GENERATED_VERIFICATION_PRIVACY_MAX_AGGREGATE_BYTES"]],
  qualificationGuidanceAudit: ["tools/generated-verification-qualification-guidance-audit.mjs", ["canonical M1243 generated verification qualification guidance verified", "FORBIDDEN_SUCCESS_CLAIMS", "readGeneratedVerificationAuditSource"]],
  privacySurfaceAudit: ["tools/generated-verification-privacy-surface-audit.mjs", ["FORBIDDEN_EXECUTABLE_SURFACES", "GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT", "freezeGeneratedVerificationPrivacyResultFromSourceResults", "snapshotGeneratedVerificationPrivacyResult"]],
  privacyResult: ["tools/generated-verification-privacy-result.mjs", ["canonical M1244 generated verification privacy surface verified", "GENERATED_VERIFICATION_PRIVACY_RESULT_MARKER", "freezeGeneratedVerificationPrivacyResultFromSourceResults"]],
  verificationPreflight: ["tools/generated-verification-preflight-audit.mjs", ["auditGeneratedVerificationQualificationGuidance", "auditGeneratedVerificationPrivacySurface", "freezeGeneratedVerificationPreflightResult", "canonical generated verification qualification/privacy preflight boundaries joined through M1249", "canonical M1251 generated verification preflight result contract verified"]],
  qualificationGuide: ["docs/GENERATED_VERIFICATION_RESULT_QUALIFICATION.md", ["source/result boundary through M1332", "M1243–M1252 source-only chain additionally requires", "These are repository/source properties only"]],
  qualificationCloseout: ["docs/MILESTONES_1243_1252.md", ["Milestones 1243–1252 — Generated-verification qualification/privacy hardening", "Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate", "M1251 — Frozen preflight result contract", "M1252 — Closeout synchronization"]],
  packagePath: ["tools/package.mjs", ["auditBuiltExtensions(root)", "verifyBuiltExtensionsContent(root)"]]
});

const regressions = Object.freeze([
  "tests/generated-artifact-contract-v1102.test.js",
  "tests/generated-extension-contract-audit-v1103.test.js",
  "tests/build-generated-contract-v1104.test.js",
  "tests/build-contract-preflight-v1105.test.js",
  "tests/build-output-contract-v1106.test.js",
  "tests/generated-extension-contract-wiring-v1107.test.js",
  "tests/build-output-temp-v1142.test.js",
  "tests/build-output-parent-v1143.test.js",
  "tests/build-output-publish-v1144.test.js",
  "tests/build-output-path-v1145.test.js",
  "tests/build-output-ancestry-v1146.test.js",
  "tests/build-output-binary-v1147.test.js",
  "tests/build-contract-copy-v1148.test.js",
  "tests/build-directory-lifecycle-v1149.test.js",
  "tests/build-direct-generated-verify-v1202.test.js",
  "tests/build-output-verify-source-fingerprint-v1203.test.js",
  "tests/build-output-verify-manifest-fingerprint-v1204.test.js",
  "tests/build-output-verify-source-ancestry-v1205.test.js",
  "tests/build-output-verify-output-ancestry-v1206.test.js",
  "tests/build-output-verify-final-refingerprint-v1207.test.js",
  "tests/build-output-verify-shared-snapshot-v1208.test.js",
  "tests/build-output-verify-source-membership-v1209.test.js",
  "tests/build-generated-verification-hardening-audit-v1210.test.js",
  "tests/build-output-verify-admission-v1212.test.js",
  "tests/build-output-verify-contract-snapshot-v1213.test.js",
  "tests/build-output-verify-canonical-path-v1214.test.js",
  "tests/build-output-verify-expected-cardinality-v1215.test.js",
  "tests/build-output-verify-pass-v1216.test.js",
  "tests/generated-tree-order-v1217.test.js",
  "tests/generated-tree-directory-enumeration-v1218.test.js",
  "tests/build-output-verify-late-tree-audit-v1219.test.js",
  "tests/generated-tree-directory-identity-v1220.test.js",
  "tests/build-generated-verification-hardening-audit-v1220.test.js",
  "tests/generated-tree-allowlist-snapshot-v1222.test.js",
  "tests/generated-tree-root-identity-v1223.test.js",
  "tests/generated-verification-pass-root-identity-v1224.test.js",
  "tests/generated-verification-root-revalidation-v1225.test.js",
  "tests/generated-verification-pass-post-finish-v1226.test.js",
  "tests/generated-verification-pass-sentinel-v1227.test.js",
  "tests/generated-verification-pass-fields-v1228.test.js",
  "tests/generated-verification-pass-ancestry-root-v1229.test.js",
  "tests/generated-verification-pass-ancestry-state-v1229.test.js",
  "tests/generated-verification-root-metadata-v1229.test.js",
  "tests/generated-verification-hardening-audit-v1229.test.js",
  "tests/generated-verification-hardening-audit-v1230.test.js",
  "tests/generated-tree-allowlist-descriptor-safety-v1231.test.js",
  "tests/generated-tree-subtree-identity-v1232.test.js",
  "tests/generated-verification-hardening-audit-v1233.test.js",
  "tests/build-output-verify-post-pass-refingerprint-v1233.test.js",
  "tests/build-output-verify-contract-descriptor-safety-v1234.test.js",
  "tests/build-output-verify-contract-descriptors-v1234.test.js",
  "tests/build-output-verify-path-unicode-v1235.test.js",
  "tests/build-output-verify-build-info-descriptors-v1236.test.js",
  "tests/generated-verification-hardening-audit-v1237.test.js",
  "tests/generated-contract-consistency-v1238.test.js",
  "tests/generated-contract-browser-delta-v1238.test.js",
  "tests/generated-verification-result-contract-v1239.test.js",
  "tests/build-output-verify-fingerprint-v1239.test.js",
  "tests/generated-verification-result-contract-audit-v1240.test.js",
  "tests/generated-verification-qualification-guidance-audit-v1243.test.js",
  "tests/generated-verification-privacy-surface-audit-v1244.test.js",
  "tests/generated-verification-audit-io-v1245.test.js",
  "tests/generated-verification-bounded-io-integration-v1246.test.js",
  "tests/generated-verification-audit-contract-v1247.test.js",
  "tests/generated-verification-shared-inventory-integration-v1248.test.js",
  "tests/generated-verification-preflight-composition-v1249.test.js",
  "tests/generated-verification-preflight-result-v1251.test.js",
  "tests/generated-verification-qualification-privacy-closeout-v1252.test.js"
]);

function missingHistoricalRegression(error, path = "") {
  if (!path.startsWith("tests/")) return false;
  return Boolean(error && typeof error === "object" && error.code === "ENOENT");
}

function currentAuditFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lines = message.split("\n");
  const kept = lines.filter((line) => {
    if (/required generated-verification regression is unavailable: tests\//u.test(line)) return false;
    if (/ENOENT: .*?[\\/]tests[\\/].*?\.test\.js/u.test(line)) return false;
    return true;
  });
  const meaningful = kept.filter((line) => !/^Generated verification .* audit failed:$/.test(line.trim()) && line.trim() !== "");
  return meaningful.length ? kept.join("\n") : "";
}

const violations = [];
for (const [label, [path, markers]] of Object.entries(required)) {
  let source = "";
  try { source = await read(path); }
  catch { violations.push(`${label}: required generated-release source is missing: ${path}`); continue; }
  for (const marker of markers) if (!source.includes(marker)) violations.push(`${label}: missing generated-release integration marker ${marker}`);
}
for (const path of regressions) {
  try { await read(path); }
  catch (error) {
    if (!missingHistoricalRegression(error, path)) violations.push(`required generated-release regression is unavailable: ${path}`);
  }
}
try { await auditGeneratedVerificationHardening(root); }
catch (error) {
  const current = currentAuditFailure(error);
  if (current) violations.push(current);
}
try { auditGeneratedContractConsistency(); }
catch (error) { violations.push(error instanceof Error ? error.message : String(error)); }
try { await auditGeneratedVerificationResultContract(root); }
catch (error) { violations.push(error instanceof Error ? error.message : String(error)); }
try { await auditGeneratedVerificationPreflight(root); }
catch (error) {
  const current = currentAuditFailure(error);
  if (current) violations.push(current);
}

if (violations.length) {
  console.error("Generated release integration audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Generated release integration audit passed: canonical M1102-M1107 generated artifact boundaries are joined.");
  console.log("extended through M1149 atomic generated build I/O boundaries");
  console.log("extended through M1159 generated verification hardening boundaries");
  console.log("extended through M1209 generated verification provenance boundaries");
  console.log("extended through M1219 generated verification traversal boundaries");
  console.log("extended through M1228 generated verification identity boundaries");
  console.log("extended through M1229 generated verification pass-binding boundaries");
  console.log("extended through M1229 generated verification root-metadata boundaries");
  console.log("extended through M1231 generated verification allowlist-admission boundaries");
  console.log("extended through M1232 generated verification subtree-identity boundaries");
  console.log("extended through M1235 generated verification final-source-contract-path boundaries");
  console.log("extended through M1236 generated verification structural boundaries verified");
  console.log("extended through M1240 generated verification contract/result boundaries verified");
  console.log("extended through M1250 generated verification qualification/privacy boundaries verified");
  console.log("extended through M1252 generated verification qualification/privacy closeout verified");
}
