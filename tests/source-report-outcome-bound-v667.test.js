import assert from "node:assert/strict";
import test from "node:test";
import { SOURCE_QUALIFICATION_FAILURE_CODE } from "../tools/source-qualification-failure.mjs";
import { SOURCE_QUALIFICATION_REPORT_MAX_ROWS, validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function row(id) {
  return {
    id,
    title: id,
    enabledByDefault: true,
    format: "hosts",
    declaredBytes: null,
    network: { block: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 },
    cosmetic: { hide: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 }
  };
}

function id(prefix, index) {
  return `${prefix}${String(index).padStart(2, "0")}`;
}

test("source report rejects combined success/failure outcomes above the shared ceiling", () => {
  const sources = Array.from({ length: SOURCE_QUALIFICATION_REPORT_MAX_ROWS }, (_, index) => row(id("a", index)));
  const failures = [{ id: "z00", error: SOURCE_QUALIFICATION_FAILURE_CODE }];
  assert.throws(() => validateSourceQualificationReport({
    sources,
    totals: { uniqueNetworkRules: 0, uniqueCosmeticRules: 0 },
    failures
  }), /combined outcomes/);
});

test("source report accepts a split outcome set at the shared ceiling", () => {
  const sources = Array.from({ length: SOURCE_QUALIFICATION_REPORT_MAX_ROWS - 1 }, (_, index) => row(id("a", index)));
  const failures = [{ id: "z00", error: SOURCE_QUALIFICATION_FAILURE_CODE }];
  assert.doesNotThrow(() => validateSourceQualificationReport({
    sources,
    totals: { uniqueNetworkRules: 0, uniqueCosmeticRules: 0 },
    failures
  }));
});
