import assert from "node:assert/strict";
import test from "node:test";
import { validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function row(overrides = {}) {
  return {
    id: "example",
    title: "Example",
    enabledByDefault: true,
    format: "hosts",
    declaredBytes: null,
    network: { block: 2, allow: 1, supported: 3, uniqueContribution: 2, overlapWithEarlierSources: 1 },
    cosmetic: { hide: 1, allow: 1, supported: 2, uniqueContribution: 1, overlapWithEarlierSources: 1 },
    ...overrides
  };
}

function report(source = row(), totals = { uniqueNetworkRules: 2, uniqueCosmeticRules: 1 }) {
  return { sources: [source], totals, failures: [] };
}

test("accepts internally consistent source report counts", () => {
  const safe = validateSourceQualificationReport(report());
  assert.equal(safe.sources[0].network.supported, 3);
  assert.equal(safe.totals.uniqueNetworkRules, 2);
});

test("rejects supported counts that do not equal direct rule counts", () => {
  const source = row();
  source.network.supported = 4;
  assert.throws(() => validateSourceQualificationReport(report(source)), /supported is inconsistent/);
});

test("rejects contribution partitions that do not equal supported counts", () => {
  const source = row();
  source.cosmetic.uniqueContribution = 2;
  assert.throws(() => validateSourceQualificationReport(report(source)), /contribution counts are inconsistent/);
});

test("rejects totals that do not equal row unique contributions", () => {
  assert.throws(
    () => validateSourceQualificationReport(report(row(), { uniqueNetworkRules: 3, uniqueCosmeticRules: 1 })),
    /uniqueNetworkRules total is inconsistent/
  );
  assert.throws(
    () => validateSourceQualificationReport(report(row(), { uniqueNetworkRules: 2, uniqueCosmeticRules: 2 })),
    /uniqueCosmeticRules total is inconsistent/
  );
});
