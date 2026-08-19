import test from "node:test";
import assert from "node:assert/strict";
import { auditGeneratedContractConsistency } from "../tools/generated-contract-consistency-audit.mjs";
import { snapshotGeneratedAllowlist } from "../tools/artifact-audit.mjs";
import { snapshotGeneratedVerificationContract } from "../tools/build-output-verify.mjs";

test("M1238 generated tree and verifier use identical frozen contracts", () => {
  const result = auditGeneratedContractConsistency();
  assert.equal(result.marker, "canonical M1238 generated tree/verifier contract consistency verified");
  assert.ok(Object.isFrozen(result));
  for (const browser of ["chromium", "firefox"]) {
    const tree = snapshotGeneratedAllowlist(browser).files;
    const verifier = snapshotGeneratedVerificationContract(browser);
    assert.ok(Object.isFrozen(tree));
    assert.ok(Object.isFrozen(verifier));
    assert.deepEqual(verifier, tree);
  }
});
