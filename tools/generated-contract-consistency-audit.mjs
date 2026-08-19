import { pathToFileURL } from "node:url";
import { snapshotGeneratedAllowlist } from "./artifact-audit.mjs";
import { snapshotGeneratedVerificationContract } from "./build-output-verify.mjs";

export const GENERATED_CONTRACT_CONSISTENCY_MAX_FILES = 4096;
export const GENERATED_CONTRACT_CONSISTENCY_MAX_PATH_BYTES = 1024;
export const GENERATED_CONTRACT_CONSISTENCY_MAX_AGGREGATE_PATH_BYTES = GENERATED_CONTRACT_CONSISTENCY_MAX_FILES * GENERATED_CONTRACT_CONSISTENCY_MAX_PATH_BYTES;
export const FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER = "rules/static.json";

const BROWSERS = Object.freeze(["chromium", "firefox"]);

function snapshotContractArray(value, browser, label) {
  if (!Array.isArray(value) || !Object.isFrozen(value)) {
    throw new TypeError(`${browser} ${label} must be a frozen array`);
  }
  const keys = Reflect.ownKeys(value);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value)) {
    throw new TypeError(`${browser} ${label} must have a data length`);
  }
  const length = lengthDescriptor.value;
  if (length <= 0 || length > GENERATED_CONTRACT_CONSISTENCY_MAX_FILES || keys.length !== length + 1) {
    throw new RangeError(`${browser} ${label} member count is invalid`);
  }
  const snapshot = new Array(length);
  let aggregatePathBytes = 0;
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") {
      throw new TypeError(`${browser} ${label} member ${index} must be a string data field`);
    }
    const bytes = Buffer.byteLength(descriptor.value, "utf8");
    if (bytes <= 0 || bytes > GENERATED_CONTRACT_CONSISTENCY_MAX_PATH_BYTES) {
      throw new RangeError(`${browser} ${label} member ${index} exceeds its path byte ceiling`);
    }
    aggregatePathBytes += bytes;
    if (aggregatePathBytes > GENERATED_CONTRACT_CONSISTENCY_MAX_AGGREGATE_PATH_BYTES) {
      throw new RangeError(`${browser} ${label} aggregate path byte ceiling exceeded`);
    }
    snapshot[index] = descriptor.value;
  }
  return Object.freeze(snapshot);
}

function assertExactBrowserContractDelta(chromium, firefox) {
  if (chromium.includes(FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER)) {
    throw new Error("Chromium generated contract must not contain the Firefox-only static rules member");
  }
  const firefoxOnlyIndexes = [];
  for (let index = 0; index < firefox.length; index += 1) {
    if (firefox[index] === FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER) firefoxOnlyIndexes.push(index);
  }
  if (firefoxOnlyIndexes.length !== 1) {
    throw new Error("Firefox generated contract must contain exactly one reviewed Firefox-only static rules member");
  }
  if (firefox.length !== chromium.length + 1) {
    throw new Error("Firefox generated contract must differ from Chromium by exactly one member");
  }
  const firefoxShared = firefox.filter((path) => path !== FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER);
  if (firefoxShared.length !== chromium.length) throw new Error("Firefox shared generated contract cardinality is invalid");
  for (let index = 0; index < chromium.length; index += 1) {
    if (chromium[index] !== firefoxShared[index]) {
      throw new Error(`Chromium/Firefox shared generated contract differs at member ${index}`);
    }
  }
}

export function auditGeneratedContractConsistency() {
  const results = [];
  const verifierContracts = Object.create(null);
  for (const browser of BROWSERS) {
    const tree = snapshotContractArray(snapshotGeneratedAllowlist(browser).files, browser, "generated-tree allowlist");
    const verifier = snapshotContractArray(snapshotGeneratedVerificationContract(browser), browser, "generated-verifier contract");
    if (tree.length !== verifier.length) {
      throw new Error(`${browser} generated-tree/verifier contract member counts differ`);
    }
    for (let index = 0; index < tree.length; index += 1) {
      if (tree[index] !== verifier[index]) {
        throw new Error(`${browser} generated-tree/verifier contract differs at member ${index}`);
      }
      if (Buffer.byteLength(tree[index], "utf8") !== Buffer.byteLength(verifier[index], "utf8")) {
        throw new Error(`${browser} generated-tree/verifier contract byte identity differs at member ${index}`);
      }
    }
    verifierContracts[browser] = verifier;
    results.push(Object.freeze({ browser, members: tree.length }));
  }
  assertExactBrowserContractDelta(verifierContracts.chromium, verifierContracts.firefox);
  return Object.freeze({
    marker: "canonical M1238 generated tree/verifier contract consistency verified",
    browserDeltaMarker: "canonical M1238 exact Chromium/Firefox generated contract delta verified",
    browsers: Object.freeze(results)
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const result = auditGeneratedContractConsistency();
    console.log(`Generated contract consistency audit passed: ${result.marker}; ${result.browserDeltaMarker}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
