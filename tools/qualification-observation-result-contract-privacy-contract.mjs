const SOURCE_BYTES = 64 * 1024;
const RAW_SOURCE_PATHS = Object.freeze([
  "tools/qualification-observation-result-contract-closeout-audit.mjs",
  "tools/qualification-observation-privacy-contract-audit.mjs",
  "tools/qualification-observation-publication-contract-audit.mjs",
  "tools/qualification-observation-hardening-result-contract-audit.mjs",
  "tools/qualification-observation-result-contract-integration-audit.mjs"
]);

export function snapshotQualificationObservationResultContractPrivacySourcePaths(candidate) {
  if (!Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Array.prototype
    || !Object.isFrozen(candidate) || candidate.length !== RAW_SOURCE_PATHS.length) {
    throw new TypeError("qualification observation result-contract privacy source paths must be the canonical frozen dense array");
  }
  const expectedKeys = ["length", "0", "1", "2", "3", "4"];
  const ownKeys = Reflect.ownKeys(candidate);
  if (ownKeys.length !== expectedKeys.length
    || ownKeys.some((key) => typeof key !== "string" || !expectedKeys.includes(key))) {
    throw new TypeError("qualification observation result-contract privacy source paths have an invalid field set");
  }
  const snapshot = [];
  for (let index = 0; index < RAW_SOURCE_PATHS.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, String(index));
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation result-contract privacy source paths[${index}] must be an enumerable own data element`);
    }
    if (descriptor.value !== RAW_SOURCE_PATHS[index]) {
      throw new TypeError(`qualification observation result-contract privacy source paths[${index}] is not canonical`);
    }
    snapshot.push(descriptor.value);
  }
  return Object.freeze(snapshot);
}

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS =
  snapshotQualificationObservationResultContractPrivacySourcePaths(RAW_SOURCE_PATHS);

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS = Object.freeze({
  sourceBytes: SOURCE_BYTES,
  sourceCount: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS.length,
  aggregateBytes: SOURCE_BYTES * QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_SOURCE_PATHS.length
});

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_SOURCE_BYTES =
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS.sourceBytes;
export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MAX_AGGREGATE_BYTES =
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_LIMITS.aggregateBytes;
