import test from "node:test";
import assert from "node:assert/strict";
import { serializeSourceQualificationReport, validateSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function report() {
  return {
    sources: [{
      id: "example", title: "Example", enabledByDefault: true, format: "hosts", declaredBytes: 12,
      network: { block: 1, allow: 0, supported: 1, uniqueContribution: 1, overlapWithEarlierSources: 0 },
      cosmetic: { hide: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 }
    }],
    totals: { uniqueNetworkRules: 1, uniqueCosmeticRules: 0 },
    failures: []
  };
}

test("source qualification report validates and serializes bounded plain data", () => {
  const safe = validateSourceQualificationReport(report());
  assert.equal(Object.isFrozen(safe), true);
  const text = serializeSourceQualificationReport(safe);
  assert.match(text, /"example"/);
  assert.equal(text.includes("sourceUrl"), false);
});

test("source qualification report rejects accessors, extra fields, and arbitrary errors", () => {
  const accessor = report();
  Object.defineProperty(accessor.totals, "uniqueNetworkRules", { enumerable: true, get() { throw new Error("getter ran"); } });
  assert.throws(() => validateSourceQualificationReport(accessor), /data field/);
  const extra = report();
  extra.sources[0].sourceUrl = "https://example.com/";
  assert.throws(() => validateSourceQualificationReport(extra), /fields/);
  const failure = report();
  failure.failures.push({ id: "example", error: "secret remote body" });
  assert.throws(() => validateSourceQualificationReport(failure), /invalid/);
});
