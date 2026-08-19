import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readGeneratedVerificationAuditSource } from "./generated-verification-audit-io.mjs";
import { GENERATED_VERIFICATION_AUDIT_LIMITS } from "./generated-verification-audit-limits.mjs";
import { snapshotGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-source-result.mjs";

const SOURCE_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxAuditPreflightSourceBytes;
const REGRESSION_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxAuditPreflightRegressionBytes;
const MAX_AUDIT_PREFLIGHT_HARDENING_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxAuditPreflightViolations;
const AUDIT_PREFLIGHT_HARDENING_RESULT_MARKER = "canonical M1261 generated verification audit/preflight hardening integrated";
const CLOSEOUT_MARKER = "canonical M1262 generated verification audit/preflight hardening closeout verified";
const M1272_CLOSEOUT_MARKER = "canonical M1272 generated verification audit contract/preflight hardening closeout verified";
const M1282_CLOSEOUT_MARKER = "canonical M1282 generated verification audit/result hardening closeout verified";
const M1291_INTEGRATION_MARKER = "canonical M1291 generated verification audit/preflight hardening tranche integrated";
const M1292_CLOSEOUT_MARKER = "canonical M1292 generated verification preflight integrity hardening closeout verified";
const M1301_INTEGRATION_MARKER = "canonical M1301 generated verification privacy/preflight integrity tranche integrated";
const M1302_CLOSEOUT_MARKER = "canonical M1302 generated verification privacy/preflight integrity hardening closeout verified";
const M1311_INTEGRATION_MARKER = "canonical M1311 generated verification audit identity/limits hardening tranche integrated";
const M1312_CLOSEOUT_MARKER = "canonical M1312 generated verification audit identity/limits hardening closeout verified";
const M1321_INTEGRATION_MARKER = "canonical M1321 generated verification privacy/diagnostic hardening tranche integrated";
const M1322_CLOSEOUT_MARKER = "canonical M1322 generated verification privacy/diagnostic hardening closeout verified";
const M1331_INTEGRATION_MARKER = "canonical M1331 generated verification read/privacy hardening tranche integrated";
const M1332_CLOSEOUT_MARKER = "canonical M1332 generated verification read/privacy hardening closeout verified";

const REQUIRED_SOURCES = Object.freeze([
  Object.freeze({
    path: "tools/generated-verification-audit-io.mjs",
    markers: Object.freeze([
      "snapshotAuditRoot",
      "snapshotAuditSourceAncestry",
      "revalidateAuditSourceAncestry",
      "snapshotGeneratedVerificationAuditPath",
      "readOpenedAuditSourceBounded",
      "Buffer.allocUnsafe(maxBytes + 1)",
      "freezeGeneratedVerificationAuditSourceResult",
      "freezeGeneratedVerificationAuditIdentity",
      "snapshotGeneratedVerificationAuditIdentityTuple",
      "AUDIT_IDENTITY_KEYS",
      "freezeGeneratedVerificationAuditPathSnapshot",
      "path segments must be a dense exact array",
      "resolveAuditSourcePath",
      "AUDIT_ANCESTRY_ENTRY_KEYS",
      "freezeGeneratedVerificationAuditAncestryEntry",
      "snapshotGeneratedVerificationAuditAncestryEntry",
      "freezeGeneratedVerificationAuditAncestryInventory",
      "freezeGeneratedVerificationAuditRootSnapshot",
      "snapshotGeneratedVerificationAuditRootSnapshot",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxPathBytes",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxSourceBytes",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxAncestryDepth",
      "assertGeneratedVerificationAuditSourceByteCeiling(maxBytes)",
      "const pathAfterStat = await lstat(fullPath)"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-audit-limits.mjs",
    markers: Object.freeze([
      "freezeGeneratedVerificationAuditLimits",
      "GENERATED_VERIFICATION_AUDIT_LIMITS",
      "maxPathBytes: 1024",
      "maxSourceBytes: 1024 * 1024",
      "maxAncestryDepth: 64",
      "maxContractEntries: 64",
      "maxPrivacyRules: 32",
      "maxPrivacyRuleLabelBytes: 96",
      "maxPrivacyRulePatternBytes: 512",
      "maxPrivacyAggregateBytes: 640 * 1024",
      "maxPrivacyViolations: 128",
      "maxQualificationGuidanceViolations: 32",
      "maxResultContractViolations: 64",
      "maxHardeningViolations: 128",
      "maxAuditPreflightViolations: 128",
      "maxHardeningSourceBytes: 256 * 1024",
      "maxHardeningRegressionBytes: 128 * 1024",
      "maxResultSourceBytes: 256 * 1024",
      "maxResultRegressionBytes: 128 * 1024",
      "maxGuidanceSourceBytes: 32 * 1024",
      "maxPrivacySourceBytes: 192 * 1024",
      "maxAuditPreflightSourceBytes: 192 * 1024",
      "maxAuditPreflightRegressionBytes: 64 * 1024",
      "assertGeneratedVerificationAuditSourceByteCeiling"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-audit-source-result.mjs",
    markers: Object.freeze([
      "snapshotGeneratedVerificationAuditSourceResult",
      "AUDIT_SOURCE_RESULT_KEYS",
      "must contain exactly path, source, and bytes",
      "freezeGeneratedVerificationAuditSourceResult(values.path, values.source, values.bytes)"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-audit-contract.mjs",
    markers: Object.freeze([
      "freezeGeneratedVerificationAuditEntry",
      "freezeGeneratedVerificationAuditEntries",
      "duplicate generated-verification audit contract path",
      "tools/generated-verification-audit-io.mjs",
      "tools/generated-verification-qualification-guidance-audit.mjs",
      "tools/generated-verification-privacy-result.mjs",
      "snapshotFrozenGeneratedVerificationAuditEntry",
      "snapshotGeneratedVerificationAuditInventory",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxSourceBytes",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxContractEntries",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyAggregateBytes",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxGuidanceSourceBytes",
      "GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacySourceBytes",
      "PRIVACY_SOURCE_MAX_BYTES",
      "assertGeneratedVerificationAuditSourceByteCeiling(maxBytes)",
      "compareCodeUnits"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-hardening-audit.mjs",
    markers: Object.freeze([
      "HARDENING_SOURCE_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxHardeningSourceBytes",
      "HARDENING_REGRESSION_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxHardeningRegressionBytes",
      "MAX_HARDENING_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxHardeningViolations",
      "recordHardeningViolation",
      "freezeGeneratedVerificationHardeningAuditResult",
      "readHardeningAuditSource",
      "snapshotGeneratedVerificationAuditSourceResult",
      "generated-verification hardening regression"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-result-contract-audit.mjs",
    markers: Object.freeze([
      "RESULT_SOURCE_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxResultSourceBytes",
      "RESULT_REGRESSION_MAX_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxResultRegressionBytes",
      "MAX_RESULT_CONTRACT_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxResultContractViolations",
      "recordResultContractViolation",
      "freezeGeneratedVerificationResultContractAuditResult",
      "snapshotGeneratedVerificationAuditSourceResult",
      "generated-verification result-contract source result"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-qualification-guidance-audit.mjs",
    markers: Object.freeze([
      "MAX_QUALIFICATION_GUIDANCE_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxQualificationGuidanceViolations",
      "recordQualificationGuidanceViolation",
      "freezeGeneratedVerificationQualificationGuidanceAuditResult",
      "canonical guide path",
      "snapshotGeneratedVerificationAuditSourceResult",
      "generated-verification qualification guidance source result"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-privacy-result.mjs",
    markers: Object.freeze([
      "GENERATED_VERIFICATION_PRIVACY_RESULT_MARKER",
      "freezeGeneratedVerificationPrivacyFileInventory",
      "snapshotGeneratedVerificationPrivacySourceResults",
      "generated-verification privacy source results must be a dense exact array",
      "generated-verification privacy source result order mismatch",
      "freezeGeneratedVerificationPrivacyResultFromSourceResults",
      "generated-verification privacy source results exceed aggregate byte ceiling",
      "maxPrivacyAggregateBytes",
      "freezeGeneratedVerificationPrivacyResult",
      "snapshotGeneratedVerificationPrivacyResult",
      "must contain exactly files, aggregateBytes, and marker",
      "privacy result marker is not canonical"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-privacy-surface-audit.mjs",
    markers: Object.freeze([
      "MAX_PRIVACY_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyViolations",
      "recordPrivacyViolation",
      "freezeGeneratedVerificationPrivacyResultFromSourceResults",
      "const result = freezeGeneratedVerificationPrivacyResultFromSourceResults(snapshots)",
      "snapshotGeneratedVerificationPrivacyResult",
      "freezeGeneratedVerificationPrivacySurfaceRule",
      "MAX_PRIVACY_RULE_LABEL_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRuleLabelBytes",
      "MAX_PRIVACY_RULE_PATTERN_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRulePatternBytes",
      "MAX_PRIVACY_RULES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRules",
      "freezeGeneratedVerificationPrivacySurfaceRules",
      "privacy matcher inventory must be a dense exact array",
      "snapshotGeneratedVerificationAuditSourceResult",
      "Node network module",
      "Node process/worker module",
      "filesystem mutation primitive",
      "dynamic import",
      "WebAssembly execution",
      "CommonJS require",
      "process environment/working-directory access",
      "host identity access",
      "const REGEXP_TEST = RegExp.prototype.test",
      "Reflect.apply(REGEXP_TEST, pattern, [source])"
    ])
  }),
  Object.freeze({
    path: "tools/generated-verification-preflight-audit.mjs",
    markers: Object.freeze([
      "snapshotGeneratedVerificationPreflightInput",
      "Reflect.ownKeys(candidate)",
      "must be an own data property",
      "MAX_PREFLIGHT_MARKER_BYTES = 512",
      "snapshotGeneratedVerificationPreflightChildMarker",
      "child audit result must be a frozen plain object",
      "PREFLIGHT_CHILD_RESULT_KEYS",
      "child audit result must contain exactly the reviewed fields",
      "assertCanonicalPreflightChildMarker",
      "RESULT_CONTRACT_MARKER",
      "QUALIFICATION_GUIDANCE_MARKER",
      "PRIVACY_SURFACE_MARKER",
      "freezeGeneratedVerificationPreflightInput",
      "PREFLIGHT_RESULT_KEYS",
      "PREFLIGHT_RESULT_MARKERS",
      "assertExactFrozenPreflightResult"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1253_1262.md",
    markers: Object.freeze([
      "M1253 — Real repository-root identity",
      "M1259 — Bounded opened-handle source reads",
      "M1262 — Closeout synchronization",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1263_1272.md",
    markers: Object.freeze([
      "M1263 — Descriptor-safe audit contract entries",
      "M1268 — Bounded privacy diagnostics",
      "M1271 — Audit/preflight hardening result binding",
      "M1272 — Closeout synchronization",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1273_1282.md",
    markers: Object.freeze([
      "M1273 — Bounded hardening-audit I/O",
      "M1275 — Bounded result-contract diagnostics",
      "M1278 — Frozen qualification-guidance success",
      "M1281 — Frozen descriptor-safe composite child results",
      "M1282 — Closeout synchronization",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1283_1292.md",
    markers: Object.freeze([
      "M1283 — Bounded hardening diagnostics",
      "M1286 — Canonical composite child markers",
      "M1288 — Bounded stateless privacy matchers",
      "M1290 — Frozen filesystem identity tuples",
      "M1291 — Composed hardening integration",
      "M1292 — Closeout synchronization",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1293_1302.md",
    markers: Object.freeze([
      "M1293 — Exact privacy matcher inventory",
      "M1295 — Captured privacy matcher execution",
      "M1298 — Historical preflight success contract",
      "M1300 — Exact audit ancestry entries",
      "M1301 — Composed hardening integration",
      "M1302 — Closeout synchronization",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1303_1312.md",
    markers: Object.freeze([
      "M1303 — Exact filesystem identity tuple resnapshotting",
      "M1306 — Canonical audit limits",
      "M1309 — Resnapshotted audit consumers",
      "M1311 — Composed hardening integration",
      "M1312 — Closeout synchronization",
      "canonical M1312 generated verification audit identity/limits hardening closeout verified",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1313_1322.md",
    markers: Object.freeze([
      "M1313 — Node network/process surface refusal",
      "M1314 — Filesystem mutation surface refusal",
      "M1317 — Shared audit diagnostic limits",
      "M1319 — Exact privacy result contract",
      "M1321 — Composed hardening integration",
      "M1322 — Closeout synchronization",
      "canonical M1322 generated verification privacy/diagnostic hardening closeout verified",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/MILESTONES_1323_1332.md",
    markers: Object.freeze([
      "M1323 — Shared hardening/result read ceilings",
      "M1326 — Guidance/privacy contract read-limit binding",
      "M1327 — Dynamic-execution surface refusal",
      "M1329 — Source-derived exact privacy results",
      "M1331 — Composed hardening integration",
      "M1332 — Closeout synchronization",
      "canonical M1332 generated verification read/privacy hardening closeout verified",
      "Issue #10 remains the authoritative exact-head browser qualification gate"
    ])
  }),
  Object.freeze({
    path: "docs/GENERATED_VERIFICATION_RESULT_QUALIFICATION.md",
    markers: Object.freeze([
      "through M1332",
      "maxBytes + 1",
      "The M1313–M1322 privacy/diagnostic chain additionally requires:",
      "filesystem mutation primitives",
      "exact frozen own-data `{ files, aggregateBytes, marker }` result",
      "The M1323–M1332 read/privacy hardening chain additionally requires:",
      "freezeGeneratedVerificationPrivacyResultFromSourceResults",
      "GENERATED_VERIFICATION_AUDIT_LIMITS",
      "Issue #10 remains the authoritative browser-observation gate",
      "never be interpreted as browser observations"
    ])
  })
]);

const REQUIRED_REGRESSIONS = Object.freeze([
  "tests/generated-verification-audit-root-identity-v1253.test.js",
  "tests/generated-verification-audit-ancestry-v1254.test.js",
  "tests/generated-verification-audit-path-unicode-v1255.test.js",
  "tests/generated-verification-audit-contract-validation-v1256.test.js",
  "tests/generated-verification-preflight-input-descriptors-v1257.test.js",
  "tests/generated-verification-preflight-marker-unicode-v1258.test.js",
  "tests/generated-verification-audit-bounded-read-v1259.test.js",
  "tests/generated-verification-privacy-inventory-v1260.test.js",
  "tests/generated-verification-audit-preflight-integration-v1261.test.js",
  "tests/generated-verification-audit-preflight-closeout-v1262.test.js",
  "tests/generated-verification-audit-contract-entry-descriptors-v1263.test.js",
  "tests/generated-verification-audit-contract-inventory-v1264.test.js",
  "tests/generated-verification-audit-contract-order-v1265.test.js",
  "tests/generated-verification-audit-pathname-identity-v1266.test.js",
  "tests/generated-verification-audit-identity-tuple-v1267.test.js",
  "tests/generated-verification-privacy-diagnostics-v1268.test.js",
  "tests/generated-verification-privacy-result-v1269.test.js",
  "tests/generated-verification-preflight-child-marker-v1270.test.js",
  "tests/generated-verification-preflight-hardening-marker-v1271.test.js",
  "tests/generated-verification-audit-preflight-closeout-v1272.test.js",
  "tests/generated-verification-hardening-io-v1273.test.js",
  "tests/generated-verification-result-audit-io-v1274.test.js",
  "tests/generated-verification-result-diagnostics-v1275.test.js",
  "tests/generated-verification-result-audit-shape-v1276.test.js",
  "tests/generated-verification-guidance-diagnostics-v1277.test.js",
  "tests/generated-verification-guidance-result-v1278.test.js",
  "tests/generated-verification-audit-preflight-diagnostics-v1279.test.js",
  "tests/generated-verification-audit-preflight-result-v1280.test.js",
  "tests/generated-verification-preflight-frozen-child-v1281.test.js",
  "tests/generated-verification-audit-result-closeout-v1282.test.js",
  "tests/generated-verification-hardening-diagnostics-v1283.test.js",
  "tests/generated-verification-hardening-result-v1284.test.js",
  "tests/generated-verification-preflight-child-keys-v1285.test.js",
  "tests/generated-verification-preflight-canonical-child-markers-v1286.test.js",
  "tests/generated-verification-privacy-rule-contract-v1287.test.js",
  "tests/generated-verification-privacy-rule-stateless-v1288.test.js",
  "tests/generated-verification-audit-source-result-v1289.test.js",
  "tests/generated-verification-audit-identity-snapshot-v1290.test.js",
  "tests/generated-verification-audit-preflight-integration-v1291.test.js",
  "tests/generated-verification-preflight-integrity-closeout-v1292.test.js",
  "tests/generated-verification-privacy-rule-inventory-v1293.test.js",
  "tests/generated-verification-privacy-source-results-v1294.test.js",
  "tests/generated-verification-privacy-regexp-execution-v1295.test.js",
  "tests/generated-verification-preflight-result-canonical-markers-v1296.test.js",
  "tests/generated-verification-preflight-frozen-input-v1297.test.js",
  "tests/generated-verification-preflight-success-contract-v1298.test.js",
  "tests/generated-verification-audit-path-snapshot-v1299.test.js",
  "tests/generated-verification-audit-ancestry-entry-v1300.test.js",
  "tests/generated-verification-audit-preflight-integration-v1301.test.js",
  "tests/generated-verification-privacy-preflight-closeout-v1302.test.js",
  "tests/generated-verification-audit-identity-tuple-resnapshot-v1303.test.js",
  "tests/generated-verification-audit-ancestry-inventory-v1304.test.js",
  "tests/generated-verification-audit-root-snapshot-v1305.test.js",
  "tests/generated-verification-audit-limits-v1306.test.js",
  "tests/generated-verification-audit-limit-binding-v1307.test.js",
  "tests/generated-verification-audit-source-result-resnapshot-v1308.test.js",
  "tests/generated-verification-audit-source-result-consumption-v1309.test.js",
  "tests/generated-verification-privacy-rule-limit-binding-v1310.test.js",
  "tests/generated-verification-audit-preflight-integration-v1311.test.js",
  "tests/generated-verification-audit-identity-limits-closeout-v1312.test.js",
  "tests/generated-verification-privacy-node-surface-v1313.test.js",
  "tests/generated-verification-privacy-filesystem-mutation-v1314.test.js",
  "tests/generated-verification-privacy-matcher-text-limits-v1315.test.js",
  "tests/generated-verification-privacy-limit-binding-v1316.test.js",
  "tests/generated-verification-audit-diagnostic-limits-v1317.test.js",
  "tests/generated-verification-audit-diagnostic-limit-binding-v1318.test.js",
  "tests/generated-verification-privacy-result-contract-v1319.test.js",
  "tests/generated-verification-privacy-result-integration-v1320.test.js",
  "tests/generated-verification-audit-preflight-integration-v1321.test.js",
  "tests/generated-verification-privacy-diagnostic-closeout-v1322.test.js",
  "tests/generated-verification-audit-read-limits-v1323.test.js",
  "tests/generated-verification-audit-read-limit-binding-v1324.test.js",
  "tests/generated-verification-support-read-limits-v1325.test.js",
  "tests/generated-verification-contract-read-limit-binding-v1326.test.js",
  "tests/generated-verification-privacy-dynamic-execution-v1327.test.js",
  "tests/generated-verification-privacy-host-identity-v1328.test.js",
  "tests/generated-verification-privacy-source-derived-result-v1329.test.js",
  "tests/generated-verification-privacy-source-derived-integration-v1330.test.js",
  "tests/generated-verification-audit-preflight-integration-v1331.test.js",
  "tests/generated-verification-read-privacy-closeout-v1332.test.js"
]);

function recordAuditPreflightHardeningViolation(violations, value) {
  if (violations.length >= MAX_AUDIT_PREFLIGHT_HARDENING_VIOLATIONS) {
    throw new Error(`Generated verification audit/preflight hardening audit exceeded its ${MAX_AUDIT_PREFLIGHT_HARDENING_VIOLATIONS}-violation diagnostic ceiling`);
  }
  violations.push(value);
}

export function freezeGeneratedVerificationAuditPreflightHardeningResult() {
  return Object.freeze({ marker: AUDIT_PREFLIGHT_HARDENING_RESULT_MARKER });
}

async function readAuditPreflightHardeningSource(root, path, maxBytes, label) {
  return snapshotGeneratedVerificationAuditSourceResult(
    await readGeneratedVerificationAuditSource(root, path, maxBytes),
    label
  );
}

export async function auditGeneratedVerificationAuditPreflightHardening(rootDirectory) {
  const root = resolve(rootDirectory);
  const violations = [];
  for (const contract of REQUIRED_SOURCES) {
    let snapshot;
    try {
      snapshot = await readAuditPreflightHardeningSource(root, contract.path, SOURCE_MAX_BYTES, `generated-verification audit/preflight source ${contract.path}`);
    } catch (error) {
      recordAuditPreflightHardeningViolation(violations, error instanceof Error ? error.message : String(error));
      continue;
    }
    for (const marker of contract.markers) {
      if (!snapshot.source.includes(marker)) {
        recordAuditPreflightHardeningViolation(violations, `${contract.path} missing generated-verification hardening marker: ${marker}`);
      }
    }
  }
  for (const path of REQUIRED_REGRESSIONS) {
    try {
      await readAuditPreflightHardeningSource(root, path, REGRESSION_MAX_BYTES, `generated-verification audit/preflight regression ${path}`);
    } catch (error) {
      recordAuditPreflightHardeningViolation(violations, error instanceof Error ? error.message : String(error));
    }
  }
  if (violations.length) {
    throw new Error("Generated verification audit/preflight hardening audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  }
  return freezeGeneratedVerificationAuditPreflightHardeningResult();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationAuditPreflightHardening(root)
    .then((result) => {
      console.log(`Generated verification audit/preflight hardening audit passed: ${result.marker}.`);
      console.log(CLOSEOUT_MARKER);
      console.log(M1272_CLOSEOUT_MARKER);
      console.log(M1282_CLOSEOUT_MARKER);
      console.log(M1291_INTEGRATION_MARKER);
      console.log(M1292_CLOSEOUT_MARKER);
      console.log(M1301_INTEGRATION_MARKER);
      console.log(M1302_CLOSEOUT_MARKER);
      console.log(M1311_INTEGRATION_MARKER);
      console.log(M1312_CLOSEOUT_MARKER);
      console.log(M1321_INTEGRATION_MARKER);
      console.log(M1322_CLOSEOUT_MARKER);
      console.log(M1331_INTEGRATION_MARKER);
      console.log(M1332_CLOSEOUT_MARKER);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
