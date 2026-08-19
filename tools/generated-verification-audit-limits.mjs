const LIMIT_KEYS = Object.freeze([
  "maxPathBytes",
  "maxSourceBytes",
  "maxAncestryDepth",
  "maxContractEntries",
  "maxPrivacyRules",
  "maxPrivacyRuleLabelBytes",
  "maxPrivacyRulePatternBytes",
  "maxPrivacyAggregateBytes",
  "maxPrivacyViolations",
  "maxQualificationGuidanceViolations",
  "maxResultContractViolations",
  "maxHardeningViolations",
  "maxAuditPreflightViolations",
  "maxHardeningSourceBytes",
  "maxHardeningRegressionBytes",
  "maxResultSourceBytes",
  "maxResultRegressionBytes",
  "maxGuidanceSourceBytes",
  "maxPrivacySourceBytes",
  "maxAuditPreflightSourceBytes",
  "maxAuditPreflightRegressionBytes"
]);

function assertPositiveSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

export function freezeGeneratedVerificationAuditLimits(candidate) {
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Object.prototype) {
    throw new Error("generated-verification audit limits must be a plain object");
  }
  const keys = Reflect.ownKeys(candidate);
  if (keys.length !== LIMIT_KEYS.length || keys.some((key) => typeof key !== "string" || !LIMIT_KEYS.includes(key))) {
    throw new Error("generated-verification audit limits must contain exactly the reviewed fields");
  }
  const values = Object.create(null);
  for (const key of LIMIT_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor) {
      throw new Error(`generated-verification audit limit ${key} must be an own data property`);
    }
    values[key] = assertPositiveSafeInteger(descriptor.value, `generated-verification audit limit ${key}`);
  }
  const result = {};
  for (const key of LIMIT_KEYS) result[key] = values[key];
  return Object.freeze(result);
}

export const GENERATED_VERIFICATION_AUDIT_LIMITS = freezeGeneratedVerificationAuditLimits({
  maxPathBytes: 1024,
  maxSourceBytes: 1024 * 1024,
  maxAncestryDepth: 64,
  maxContractEntries: 64,
  maxPrivacyRules: 32,
  maxPrivacyRuleLabelBytes: 96,
  maxPrivacyRulePatternBytes: 512,
  maxPrivacyAggregateBytes: 640 * 1024,
  maxPrivacyViolations: 128,
  maxQualificationGuidanceViolations: 32,
  maxResultContractViolations: 64,
  maxHardeningViolations: 128,
  maxAuditPreflightViolations: 128,
  maxHardeningSourceBytes: 256 * 1024,
  maxHardeningRegressionBytes: 128 * 1024,
  maxResultSourceBytes: 256 * 1024,
  maxResultRegressionBytes: 128 * 1024,
  maxGuidanceSourceBytes: 32 * 1024,
  maxPrivacySourceBytes: 192 * 1024,
  maxAuditPreflightSourceBytes: 192 * 1024,
  maxAuditPreflightRegressionBytes: 64 * 1024
});

export function assertGeneratedVerificationAuditSourceByteCeiling(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > GENERATED_VERIFICATION_AUDIT_LIMITS.maxSourceBytes) {
    throw new Error("generated-verification audit source byte ceiling is invalid");
  }
  return value;
}
