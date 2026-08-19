import assert from "node:assert/strict";
import test from "node:test";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";
import { validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function report(declaredBytes) {
  return {
    sources: [{
      id: "source-a",
      title: "Source A",
      enabledByDefault: true,
      format: "hosts",
      declaredBytes,
      network: { block: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 },
      cosmetic: { hide: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 }
    }],
    totals: { uniqueNetworkRules: 0, uniqueCosmeticRules: 0 },
    failures: []
  };
}

test("accepts null and the exact remote-list byte ceiling", () => {
  assert.equal(validateSourceQualificationReport(report(null)).sources[0].declaredBytes, null);
  assert.equal(validateSourceQualificationReport(report(MAX_REMOTE_LIST_BYTES)).sources[0].declaredBytes, MAX_REMOTE_LIST_BYTES);
});

test("rejects declared byte diagnostics above the download ceiling", () => {
  assert.throws(() => validateSourceQualificationReport(report(MAX_REMOTE_LIST_BYTES + 1)), /declaredBytes/);
});
