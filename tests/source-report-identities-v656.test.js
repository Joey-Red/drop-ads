import assert from "node:assert/strict";
import test from "node:test";
import { validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

const FAILURE_CODE = "source-unavailable-or-invalid";

function row(id, uniqueNetworkRules = 0) {
  return {
    id,
    title: id,
    enabledByDefault: true,
    format: "hosts",
    declaredBytes: null,
    network: { block: uniqueNetworkRules, allow: 0, supported: uniqueNetworkRules, uniqueContribution: uniqueNetworkRules, overlapWithEarlierSources: 0 },
    cosmetic: { hide: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 }
  };
}

function report(sources, failures = []) {
  return {
    sources,
    totals: { uniqueNetworkRules: sources.reduce((sum, source) => sum + source.network.uniqueContribution, 0), uniqueCosmeticRules: 0 },
    failures
  };
}

test("accepts strictly ascending disjoint source and failure ids", () => {
  const safe = validateSourceQualificationReport(report(
    [row("alpha", 1), row("beta", 2)],
    [{ id: "gamma", error: FAILURE_CODE }]
  ));
  assert.deepEqual(safe.sources.map((source) => source.id), ["alpha", "beta"]);
});

test("rejects duplicate or reordered successful ids", () => {
  assert.throws(() => validateSourceQualificationReport(report([row("alpha"), row("alpha")])), /duplicate id|strictly ascending/);
  assert.throws(() => validateSourceQualificationReport(report([row("beta"), row("alpha")])), /strictly ascending/);
});

test("rejects duplicate or reordered failure ids", () => {
  const duplicate = [{ id: "gamma", error: FAILURE_CODE }, { id: "gamma", error: FAILURE_CODE }];
  assert.throws(() => validateSourceQualificationReport(report([], duplicate)), /duplicate id|strictly ascending/);
  const reversed = [{ id: "zeta", error: FAILURE_CODE }, { id: "gamma", error: FAILURE_CODE }];
  assert.throws(() => validateSourceQualificationReport(report([], reversed)), /strictly ascending/);
});

test("rejects an id appearing in both success and failure sets", () => {
  assert.throws(
    () => validateSourceQualificationReport(report([row("alpha")], [{ id: "alpha", error: FAILURE_CODE }])),
    /cannot be both successful and failed/
  );
});
