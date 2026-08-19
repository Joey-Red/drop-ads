import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  GENERATED_VERIFICATION_PRIVACY_MAX_AGGREGATE_BYTES,
  GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT
} from "./generated-verification-audit-contract.mjs";
import { readGeneratedVerificationAuditSource } from "./generated-verification-audit-io.mjs";
import { GENERATED_VERIFICATION_AUDIT_LIMITS } from "./generated-verification-audit-limits.mjs";
import { snapshotGeneratedVerificationAuditSourceResult } from "./generated-verification-audit-source-result.mjs";
import {
  freezeGeneratedVerificationPrivacyResultFromSourceResults,
  snapshotGeneratedVerificationPrivacyResult
} from "./generated-verification-privacy-result.mjs";

const MAX_PRIVACY_VIOLATIONS = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyViolations;
const MAX_PRIVACY_RULES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRules;
const MAX_PRIVACY_RULE_LABEL_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRuleLabelBytes;
const MAX_PRIVACY_RULE_PATTERN_BYTES = GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRulePatternBytes;
const PRIVACY_RULE_LABEL_CONTROL_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;
const PRIVACY_RULE_KEYS = Object.freeze(["pattern", "label"]);
const REGEXP_TEST = RegExp.prototype.test;

export function freezeGeneratedVerificationPrivacySurfaceRule(pattern, label) {
  const patternKeys = pattern !== null && typeof pattern === "object" ? Reflect.ownKeys(pattern) : [];
  const lastIndexDescriptor = pattern !== null && typeof pattern === "object"
    ? Object.getOwnPropertyDescriptor(pattern, "lastIndex")
    : undefined;
  if (
    !(pattern instanceof RegExp) ||
    Object.getPrototypeOf(pattern) !== RegExp.prototype ||
    patternKeys.length !== 1 ||
    patternKeys[0] !== "lastIndex" ||
    !lastIndexDescriptor ||
    !("value" in lastIndexDescriptor) ||
    "get" in lastIndexDescriptor ||
    "set" in lastIndexDescriptor ||
    lastIndexDescriptor.value !== 0 ||
    pattern.global ||
    pattern.sticky ||
    Buffer.byteLength(pattern.source, "utf8") > MAX_PRIVACY_RULE_PATTERN_BYTES
  ) {
    throw new Error("generated-verification privacy matcher must be an exact bounded stateless native RegExp");
  }
  if (
    typeof label !== "string" ||
    label.length === 0 ||
    Buffer.byteLength(label, "utf8") > MAX_PRIVACY_RULE_LABEL_BYTES ||
    !label.isWellFormed() ||
    label.normalize("NFC") !== label ||
    PRIVACY_RULE_LABEL_CONTROL_TEXT.test(label)
  ) {
    throw new Error("generated-verification privacy matcher label is invalid");
  }
  Object.freeze(pattern);
  return Object.freeze({ pattern, label });
}

function snapshotFrozenPrivacyRule(candidate, index) {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate) ||
    Object.getPrototypeOf(candidate) !== Object.prototype ||
    !Object.isFrozen(candidate)
  ) {
    throw new Error(`generated-verification privacy matcher inventory entry ${index} must be a frozen plain object`);
  }
  const keys = Reflect.ownKeys(candidate);
  if (
    keys.length !== PRIVACY_RULE_KEYS.length ||
    keys.some((key) => typeof key !== "string" || !PRIVACY_RULE_KEYS.includes(key))
  ) {
    throw new Error(`generated-verification privacy matcher inventory entry ${index} must contain exactly pattern and label`);
  }
  const values = Object.create(null);
  for (const key of PRIVACY_RULE_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification privacy matcher inventory entry ${index} ${key} must be an own data property`);
    }
    values[key] = descriptor.value;
  }
  return freezeGeneratedVerificationPrivacySurfaceRule(values.pattern, values.label);
}

export function freezeGeneratedVerificationPrivacySurfaceRules(entries) {
  if (!Array.isArray(entries)) throw new Error("generated-verification privacy matcher inventory must be an array");
  const lengthDescriptor = Object.getOwnPropertyDescriptor(entries, "length");
  const length = lengthDescriptor?.value;
  if (!Number.isSafeInteger(length) || length <= 0 || length > MAX_PRIVACY_RULES) {
    throw new Error("generated-verification privacy matcher inventory length is invalid");
  }
  const expectedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
  const keys = Reflect.ownKeys(entries);
  if (keys.length !== expectedKeys.size || keys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) {
    throw new Error("generated-verification privacy matcher inventory must be a dense exact array");
  }
  const rules = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(entries, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification privacy matcher inventory index ${index} must be an own data property`);
    }
    rules.push(snapshotFrozenPrivacyRule(descriptor.value, index));
  }
  return Object.freeze(rules);
}

const FORBIDDEN_EXECUTABLE_SURFACES = freezeGeneratedVerificationPrivacySurfaceRules([
  freezeGeneratedVerificationPrivacySurfaceRule(/(?:^|[^.\w])fetch\s*\(/m, "fetch"),
  freezeGeneratedVerificationPrivacySurfaceRule(/XMLHttpRequest\b/, "XMLHttpRequest"),
  freezeGeneratedVerificationPrivacySurfaceRule(/WebSocket\s*\(/, "WebSocket"),
  freezeGeneratedVerificationPrivacySurfaceRule(/sendBeacon\s*\(/, "sendBeacon"),
  freezeGeneratedVerificationPrivacySurfaceRule(/navigator\s*\./, "navigator"),
  freezeGeneratedVerificationPrivacySurfaceRule(/(?:chrome|browser)\s*\.\s*storage\b/, "extension storage"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\blocalStorage\b/, "localStorage"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bsessionStorage\b/, "sessionStorage"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bindexedDB\b/, "indexedDB"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bdocument\s*\./, "document"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bwindow\s*\./, "window"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bnode:(?:http|https|http2|net|tls|dns|dgram)\b/, "Node network module"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bnode:(?:child_process|worker_threads|cluster)\b/, "Node process/worker module"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bimport\s*\{[^}\r\n]*\b(?:writeFile|appendFile|truncate|unlink|rename|rm|rmdir|mkdir|mkdtemp|symlink|link|chmod|chown|createWriteStream)\b[^}\r\n]*\}\s*from\s*["']node:fs(?:\/promises)?["']/, "filesystem mutation primitive"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\b(?:writeFile|appendFile|truncate|unlink|rename|rm|rmdir|mkdir|mkdtemp|symlink|link|chmod|chown|createWriteStream)\s*\(/, "filesystem mutation primitive"),
  freezeGeneratedVerificationPrivacySurfaceRule(/(?:^|[^.\w])eval\s*\(/m, "eval"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\b(?:new\s+)?Function\s*\(/, "Function constructor"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bimport\s*\(/, "dynamic import"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bimportScripts\s*\(/, "importScripts"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bWebAssembly\s*\.\s*(?:compile|compileStreaming|instantiate|instantiateStreaming)\b/, "WebAssembly execution"),
  freezeGeneratedVerificationPrivacySurfaceRule(/(?:^|[^.\w])require\s*\(/m, "CommonJS require"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bprocess\s*\.\s*(?:env|cwd\s*\()/, "process environment/working-directory access"),
  freezeGeneratedVerificationPrivacySurfaceRule(/\bnode:os\b|\b(?:hostname|userInfo|homedir)\s*\(/, "host identity access")
]);

function recordPrivacyViolation(violations, value) {
  if (violations.length >= MAX_PRIVACY_VIOLATIONS) {
    throw new Error(
      `Generated verification privacy surface audit exceeded its ${MAX_PRIVACY_VIOLATIONS}-violation diagnostic ceiling`
    );
  }
  violations.push(value);
}

export async function auditGeneratedVerificationPrivacySurface(rootDirectory) {
  const root = resolve(rootDirectory);
  const violations = [];
  const snapshots = [];
  let aggregateBytes = 0;
  for (const { path, maxBytes } of GENERATED_VERIFICATION_PRIVACY_SOURCE_CONTRACT) {
    let snapshot;
    try {
      snapshot = snapshotGeneratedVerificationAuditSourceResult(
        await readGeneratedVerificationAuditSource(root, path, maxBytes),
        `generated-verification privacy source read ${path}`
      );
    } catch (error) {
      recordPrivacyViolation(violations, error instanceof Error ? error.message : String(error));
      continue;
    }
    aggregateBytes += snapshot.bytes;
    if (!Number.isSafeInteger(aggregateBytes) || aggregateBytes > GENERATED_VERIFICATION_PRIVACY_MAX_AGGREGATE_BYTES) {
      recordPrivacyViolation(
        violations,
        `generated-verification privacy audit exceeds its ${GENERATED_VERIFICATION_PRIVACY_MAX_AGGREGATE_BYTES}-byte aggregate source boundary`
      );
      break;
    }
    snapshots.push(snapshot);
  }
  for (const { path, source } of snapshots) {
    for (const { pattern, label } of FORBIDDEN_EXECUTABLE_SURFACES) {
      if (Reflect.apply(REGEXP_TEST, pattern, [source])) {
        recordPrivacyViolation(violations, `${path} exposes forbidden generated-verification privacy surface: ${label}`);
      }
    }
  }
  if (violations.length) {
    throw new Error("Generated verification privacy surface audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  }
  const result = freezeGeneratedVerificationPrivacyResultFromSourceResults(snapshots);
  return snapshotGeneratedVerificationPrivacyResult(result);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationPrivacySurface(root)
    .then((result) => console.log(`Generated verification privacy surface audit passed: ${result.marker}.`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
