import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/background.js", import.meta.url), "utf8");

test("M418 production bootstrap returns mandatory policy-convergence registration", () => {
  assert.match(
    source,
    /installMandatoryRecovery\(runtime\)\s*\{\s*return installPolicyConvergence\(\{ api, controller: runtime \}\);\s*\}/s
  );
  assert.doesNotMatch(
    source,
    /installMandatoryRecovery\(runtime\)\s*\{\s*installPolicyConvergence\(\{ api, controller: runtime \}\);\s*\}/s
  );
});
