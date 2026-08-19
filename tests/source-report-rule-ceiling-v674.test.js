import assert from "node:assert/strict";
import test from "node:test";
import { MAX_REMOTE_SUPPORTED_RULES } from "../src/core/list-limits.js";
import { validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function report(networkSupported, cosmeticSupported) {
  return {
    sources: [{
      id: "source-a",
      title: "Source A",
      enabledByDefault: true,
      format: "hosts",
      declaredBytes: null,
      network: {
        block: networkSupported,
        allow: 0,
        supported: networkSupported,
        uniqueContribution: networkSupported,
        overlapWithEarlierSources: 0
      },
      cosmetic: {
        hide: cosmeticSupported,
        allow: 0,
        supported: cosmeticSupported,
        uniqueContribution: cosmeticSupported,
        overlapWithEarlierSources: 0
      }
    }],
    totals: { uniqueNetworkRules: networkSupported, uniqueCosmeticRules: cosmeticSupported },
    failures: []
  };
}

test("accepts a source row exactly at the supported-rule ceiling", () => {
  assert.equal(validateSourceQualificationReport(report(MAX_REMOTE_SUPPORTED_RULES, 0)).sources.length, 1);
});

test("rejects a source row whose combined network and cosmetic rules exceed the parser ceiling", () => {
  assert.throws(
    () => validateSourceQualificationReport(report(MAX_REMOTE_SUPPORTED_RULES, 1)),
    /supported rules/
  );
});
