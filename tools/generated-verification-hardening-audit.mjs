import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readGeneratedVerificationAuditSource } from "./generated-verification-audit-io.mjs";
import { GENERATED_VERIFICATION_AUDIT_LIMITS } from "./generated-verification-audit-limits.mjs";
import { snapshotGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-source-result.mjs";

const HARDENING_SOURCE_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxHardeningSourceBytes;
const HARDENING_REGRESSION_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxHardeningRegressionBytes;
const MAX_HARDENING_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxHardeningViolations;

const required = Object.freeze({
  build: ["tools/build.mjs", [
    "verifyBuiltExtensionsContent(root)",
    "Verified generated output source fingerprint differs from the direct build fingerprint",
    "Build failed and partial generated output could not be invalidated"
  ]],
  verify: ["tools/build-output-verify.mjs", [
    "readRegularFileBounded",
    "BUILD_OUTPUT_BINARY_MAX_BYTES",
    "GENERATED_VERIFY_AGGREGATE_MAX_BYTES = 64 * 1024 * 1024",
    "GENERATED_VERIFY_PATH_MAX_BYTES = 1024",
    "MANIFEST_SOURCE_MAX_BYTES = 256 * 1024",
    "MAX_VERIFICATION_CONTRACT_FILES = 4096",
    "new TextDecoder(\"utf-8\", { fatal: true })",
    "assertVerificationBrowser(browser)",
    "resolveVerificationRoot(rootDirectory)",
    "snapshotVerificationContract(browser)",
    "snapshotVerificationContractSource",
    "Reflect.ownKeys(source)",
    "Object.getOwnPropertyDescriptor(source, \"length\")",
    "generated verification contract must be dense and field-exact",
    "generated verification contract entries must be string data fields",
    "VERIFICATION_PATH_CONTROL_TEXT",
    "STRING_IS_WELL_FORMED",
    "STRING_NORMALIZE",
    "must be well-formed Unicode",
    "must use NFC Unicode",
    "contains forbidden control text",
    "snapshotBuildFingerprintInputs",
    "snapshotBuildFingerprintInputs(buildInfo.inputs)",
    "for (const descriptor of inputs)",
    "Object.freeze(files)",
    "assertCanonicalVerificationRelativePath",
    "resolveVerificationChild",
    "expected.has(canonicalPath)",
    "expected.size !== contract.length",
    "assertExpectedSourceMatchesBuildInfo",
    "snapshotBuildInputDirectoryAncestry",
    "revalidateBuildInputDirectoryAncestry",
    "readExpectedFingerprintBoundSource",
    "snapshotBuildInputDirectoryAncestry(distDirectory, output)",
    "source state changed during generated verification",
    "const postPassBuildInfo = await createBuildInfo(root)",
    "source state changed during final generated verification pass completion",
    "const sharedBuildInfo = await createBuildInfo(root)",
    "Source state changed across Chromium/Firefox generated verification",
    "assertVerificationSourceMembership(browser, descriptorMap)",
    "beginGeneratedVerificationPass(distDirectory)",
    "finishGeneratedVerificationPass(verificationPass)",
    "await auditGeneratedTree(distDirectory, browser)",
    "generated verification source",
    "generated verification output",
    "aggregate generated verification byte ceiling exceeded"
  ]],
  pass: ["tools/generated-verification-pass.mjs", [
    "snapshotBuildInputDirectoryAncestry",
    "revalidateBuildInputDirectoryAncestry",
    "Generated verification pass state must be a frozen data object",
    "ROOT_IDENTITY_KEYS",
    "snapshotRootIdentityState",
    "descriptor.writable || descriptor.configurable",
    "Generated verification output root identity changed before ancestry revalidation",
    "Generated verification output root identity changed during ancestry revalidation",
    "VERIFICATION_ROOT_SENTINEL",
    "verificationRootSentinel",
    "Generated verification ancestry sentinel escaped or aliased its output root",
    "ANCESTRY_ENTRY_KEYS",
    "MAX_VERIFICATION_ANCESTRY_ENTRIES = 64",
    "snapshotAncestryEntryState",
    "Generated verification pass ancestry must be dense without extra fields",
    "Generated verification pass ancestry must not contain holes",
    "assertAncestryRootMatchesPass",
    "Generated verification pass ancestry must be a frozen array",
    "Generated verification pass ancestry root does not match its output root",
    "values.ancestry = assertAncestryRootMatchesPass(values.ancestry, values.distDirectory)",
    "Generated verification directory size metadata is invalid",
    "Generated verification directory time metadata is invalid",
    "Number.isSafeInteger(stat.size)",
    "beginGeneratedVerificationPass",
    "finishGeneratedVerificationPass"
  ]],
  tree: ["tools/artifact-audit.mjs", [
    "MAX_GENERATED_TREE_ENTRIES = 4096",
    "MAX_GENERATED_TREE_DIRECTORIES = 4096",
    "MAX_GENERATED_TREE_DIRECTORY_ENTRIES = 4096",
    "MAX_GENERATED_TREE_ALLOWLIST_FILES = 4096",
    "MAX_GENERATED_TREE_PATH_BYTES = 1024",
    "MAX_GENERATED_TREE_VIOLATIONS = 128",
    "root must be a real non-symlink directory",
    "compareGeneratedPathCodeUnits",
    "GENERATED_TREE_ALLOWLISTS",
    "snapshotGeneratedAllowlist",
    "snapshotGeneratedAllowlistSource",
    "Reflect.ownKeys(source)",
    "Object.getOwnPropertyDescriptor(source, \"length\")",
    "generated extension allowlist must be dense and field-exact",
    "generated extension allowlist entries must be string data fields",
    "generated extension allowlist contains duplicate path",
    "opendir(current)",
    "snapshotGeneratedDirectoryIdentity",
    "assertGeneratedDirectoryIdentityUnchanged",
    "assertGeneratedSubtreeDirectoryIdentityUnchanged",
    "generated extension directory changed during subtree traversal",
    "assertGeneratedRootIdentityUnchanged",
    "changed during tree audit",
    "changed during enumeration",
    "per-directory entry ceiling exceeded",
    "generatedEntryType(await lstat(absolute))",
    "assertCanonicalGeneratedPath",
    "violation ceiling exceeded"
  ]]
});

const regressions = Object.freeze([
  "tests/build-output-source-read-v1152.test.js",
  "tests/build-output-generated-read-v1153.test.js",
  "tests/generated-tree-bounds-v1154.test.js",
  "tests/generated-tree-types-v1155.test.js",
  "tests/build-output-aggregate-v1156.test.js",
  "tests/generated-tree-path-v1157.test.js",
  "tests/generated-tree-violations-v1158.test.js",
  "tests/build-direct-generated-verify-v1202.test.js",
  "tests/build-output-verify-source-fingerprint-v1203.test.js",
  "tests/build-output-verify-manifest-fingerprint-v1204.test.js",
  "tests/build-output-verify-source-ancestry-v1205.test.js",
  "tests/build-output-verify-output-ancestry-v1206.test.js",
  "tests/build-output-verify-final-refingerprint-v1207.test.js",
  "tests/build-output-verify-shared-snapshot-v1208.test.js",
  "tests/build-output-verify-source-membership-v1209.test.js",
  "tests/build-output-verify-admission-v1212.test.js",
  "tests/build-output-verify-contract-snapshot-v1213.test.js",
  "tests/build-output-verify-canonical-path-v1214.test.js",
  "tests/build-output-verify-expected-cardinality-v1215.test.js",
  "tests/build-output-verify-pass-v1216.test.js",
  "tests/generated-tree-order-v1217.test.js",
  "tests/generated-tree-directory-enumeration-v1218.test.js",
  "tests/build-output-verify-late-tree-audit-v1219.test.js",
  "tests/generated-tree-directory-identity-v1220.test.js",
  "tests/generated-tree-allowlist-snapshot-v1222.test.js",
  "tests/generated-tree-root-identity-v1223.test.js",
  "tests/generated-verification-pass-root-identity-v1224.test.js",
  "tests/generated-verification-root-revalidation-v1225.test.js",
  "tests/generated-verification-pass-post-finish-v1226.test.js",
  "tests/generated-verification-pass-sentinel-v1227.test.js",
  "tests/generated-verification-pass-ancestry-root-v1227.test.js",
  "tests/generated-verification-pass-fields-v1228.test.js",
  "tests/generated-verification-pass-ancestry-root-v1229.test.js",
  "tests/generated-verification-pass-ancestry-state-v1229.test.js",
  "tests/generated-verification-root-metadata-v1229.test.js",
  "tests/generated-tree-allowlist-descriptor-safety-v1231.test.js",
  "tests/generated-tree-subtree-identity-v1232.test.js",
  "tests/build-output-verify-post-pass-refingerprint-v1233.test.js",
  "tests/build-output-verify-contract-descriptor-safety-v1234.test.js",
  "tests/build-output-verify-contract-descriptors-v1234.test.js",
  "tests/build-output-verify-path-unicode-v1235.test.js",
  "tests/build-output-verify-build-info-descriptors-v1236.test.js"
]);

function recordHardeningViolation(violations, value) {
  if (violations.length >= MAX_HARDENING_VIOLATIONS) {
    throw new Error(`Generated verification hardening audit exceeded its ${MAX_HARDENING_VIOLATIONS}-violation diagnostic ceiling`);
  }
  violations.push(value);
}

export function freezeGeneratedVerificationHardeningAuditResult() {
  return Object.freeze({
    marker: "canonical M1152-M1158 generated verification boundaries verified",
    extensionMarker: "extended through M1209 generated verification provenance boundaries verified",
    traversalMarker: "extended through M1219 generated verification traversal boundaries verified",
    identityMarker: "extended through M1228 generated verification identity boundaries verified",
    passBindingMarker: "extended through M1229 generated verification pass-binding boundaries verified",
    metadataMarker: "extended through M1229 generated verification root-metadata boundaries verified",
    allowlistMarker: "extended through M1231 generated verification allowlist-admission boundaries verified",
    subtreeMarker: "extended through M1232 generated verification subtree-identity boundaries verified",
    finalMarker: "extended through M1235 generated verification final-source-contract-path boundaries verified",
    structuralMarker: "extended through M1236 generated verification structural boundaries verified"
  });
}

async function readHardeningAuditSource(root, path, maxBytes, label) {
  return snapshotGeneratedVerificationAuditSourceResult(
    await readGeneratedVerificationAuditSource(root, path, maxBytes),
    label
  );
}

export async function auditGeneratedVerificationHardening(rootDirectory) {
  const root = resolve(rootDirectory);
  const violations = [];
  for (const [label, [path, markers]] of Object.entries(required)) {
    let source = "";
    try {
      source = (await readHardeningAuditSource(root, path, HARDENING_SOURCE_MAX_BYTES, `generated-verification hardening source ${label}`)).source;
    } catch (error) {
      recordHardeningViolation(violations, `${label}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    for (const marker of markers) {
      if (!source.includes(marker)) recordHardeningViolation(violations, `${label}: missing generated-verification marker ${marker}`);
    }
  }
  for (const path of regressions) {
    try {
      await readHardeningAuditSource(root, path, HARDENING_REGRESSION_MAX_BYTES, `generated-verification hardening regression ${path}`);
    } catch (error) {
      recordHardeningViolation(violations, `required generated-verification regression is unavailable: ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (violations.length) throw new Error("Generated verification hardening audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  return freezeGeneratedVerificationHardeningAuditResult();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationHardening(root)
    .then((result) => {
      console.log(`Generated verification hardening audit passed: ${result.marker}.`);
      console.log(result.extensionMarker);
      console.log(result.traversalMarker);
      console.log(result.identityMarker);
      console.log(result.passBindingMarker);
      console.log(result.metadataMarker);
      console.log(result.allowlistMarker);
      console.log(result.subtreeMarker);
      console.log(result.finalMarker);
      console.log(result.structuralMarker);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
