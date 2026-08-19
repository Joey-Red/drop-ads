import test from "node:test";
import assert from "node:assert/strict";
import {
  auditGeneratedContractConsistency,
  FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER
} from "../tools/generated-contract-consistency-audit.mjs";
import { snapshotGeneratedVerificationContract } from "../tools/build-output-verify.mjs";

test("M1238 Firefox differs from Chromium only by reviewed static rules", () => {
  const result = auditGeneratedContractConsistency();
  assert.equal(result.browserDeltaMarker, "canonical M1238 exact Chromium/Firefox generated contract delta verified");
  const chromium = snapshotGeneratedVerificationContract("chromium");
  const firefox = snapshotGeneratedVerificationContract("firefox");
  assert.equal(chromium.includes(FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER), false);
  assert.equal(firefox.filter((path) => path === FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER).length, 1);
  assert.deepEqual(firefox.filter((path) => path !== FIREFOX_ONLY_GENERATED_CONTRACT_MEMBER), chromium);
});
