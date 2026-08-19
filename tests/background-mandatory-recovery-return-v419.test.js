import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/background.js", import.meta.url), "utf8");

test("M419 production bootstrap returns the mandatory policy-convergence registration", () => {
  assert.match(
    source,
    /installMandatoryRecovery\(runtime\)\s*\{\s*return installPolicyConvergence\(\{ api, controller: runtime \}\);\s*\}/s
  );
  assert.doesNotMatch(
    source,
    /installMandatoryRecovery\(runtime\)\s*\{\s*installPolicyConvergence\(\{ api, controller: runtime \}\);\s*\}/s
  );
});

test("M419 mandatory recovery remains ahead of optional feature installation", () => {
  const mandatoryIndex = source.indexOf("installMandatoryRecovery(runtime)");
  const optionalIndex = source.indexOf("optionalFeatures:");
  assert.ok(mandatoryIndex >= 0);
  assert.ok(optionalIndex > mandatoryIndex);
});
