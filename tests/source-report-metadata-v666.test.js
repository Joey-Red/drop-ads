import assert from "node:assert/strict";
import test from "node:test";
import { NATIVE_LIST_FORMAT } from "../src/core/lists.js";
import { validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function row(overrides = {}) {
  return {
    id: "example",
    title: "Example",
    enabledByDefault: true,
    format: "hosts",
    declaredBytes: null,
    network: { block: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 },
    cosmetic: { hide: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 },
    ...overrides
  };
}

function report(source) {
  return { sources: [source], totals: { uniqueNetworkRules: 0, uniqueCosmeticRules: 0 }, failures: [] };
}

test("source report accepts only supported subscription formats", () => {
  for (const format of ["hosts", "third-party", NATIVE_LIST_FORMAT]) {
    assert.doesNotThrow(() => validateSourceQualificationReport(report(row({ format }))));
  }
  assert.throws(() => validateSourceQualificationReport(report(row({ format: "unknown" }))), /format is unsupported/);
});

test("source report titles must already be canonical trimmed text", () => {
  assert.throws(() => validateSourceQualificationReport(report(row({ title: " Example " }))), /canonical trimmed text/);
  assert.doesNotThrow(() => validateSourceQualificationReport(report(row({ title: "Example" }))));
});
