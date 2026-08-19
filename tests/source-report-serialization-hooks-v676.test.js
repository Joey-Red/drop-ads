import assert from "node:assert/strict";
import test from "node:test";
import { serializeSourceQualificationReport } from "../tools/source-qualification-report.mjs";

function report() {
  return {
    sources: [{
      id: "source-a",
      title: "Source A",
      enabledByDefault: true,
      format: "hosts",
      declaredBytes: 12,
      network: { block: 1, allow: 0, supported: 1, uniqueContribution: 1, overlapWithEarlierSources: 0 },
      cosmetic: { hide: 0, allow: 0, supported: 0, uniqueContribution: 0, overlapWithEarlierSources: 0 }
    }],
    totals: { uniqueNetworkRules: 1, uniqueCosmeticRules: 0 },
    failures: []
  };
}

test("source report serialization ignores inherited toJSON hooks", () => {
  const priorObject = Object.prototype.toJSON;
  const priorArray = Array.prototype.toJSON;
  let touched = 0;
  Object.prototype.toJSON = function toJSON() { touched += 1; throw new Error("object hook ran"); };
  Array.prototype.toJSON = function toJSON() { touched += 1; throw new Error("array hook ran"); };
  try {
    const text = serializeSourceQualificationReport(report());
    assert.match(text, /"source-a"/);
    assert.equal(touched, 0);
  } finally {
    if (priorObject === undefined) delete Object.prototype.toJSON;
    else Object.prototype.toJSON = priorObject;
    if (priorArray === undefined) delete Array.prototype.toJSON;
    else Array.prototype.toJSON = priorArray;
  }
});
