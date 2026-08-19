import assert from "node:assert/strict";
import test from "node:test";
import { compareQualificationText } from "../tools/source-qualification-order.mjs";
import { validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

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

test("qualification comparator uses fixed code-unit ordering", () => {
  assert.equal(compareQualificationText("A", "a"), -1);
  assert.equal(compareQualificationText("a", "A"), 1);
  assert.equal(compareQualificationText("a", "a"), 0);
  assert.throws(() => compareQualificationText({}, "a"), /strings/);
});

test("report ascending-id validation follows fixed comparator", () => {
  const report = {
    sources: [row("A"), row("a")],
    totals: { uniqueNetworkRules: 0, uniqueCosmeticRules: 0 },
    failures: []
  };
  assert.doesNotThrow(() => validateSourceQualificationReport(report));
  assert.throws(() => validateSourceQualificationReport({ ...report, sources: [row("a"), row("A")] }), /strictly ascending/);
});
