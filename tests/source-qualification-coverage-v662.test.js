import assert from "node:assert/strict";
import test from "node:test";
import { assertQualificationOutcomeCoverage } from "../tools/source-qualification-coverage.mjs";
import { SOURCE_QUALIFICATION_FAILURE_CODE } from "../tools/source-qualification-failure.mjs";

function source(id) {
  return { id, title: id, format: "hosts", sourceUrl: `https://example.com/${id}.txt`, enabled: true, builtIn: true };
}

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

function report(sources, failures) {
  return { sources, totals: { uniqueNetworkRules: 0, uniqueCosmeticRules: 0 }, failures };
}

test("coverage accepts one exact outcome per selected source", () => {
  assert.doesNotThrow(() => assertQualificationOutcomeCoverage(
    [source("a"), source("b")],
    report([row("a")], [{ id: "b", error: SOURCE_QUALIFICATION_FAILURE_CODE }])
  ));
});

test("coverage rejects missing and extra outcomes", () => {
  assert.throws(() => assertQualificationOutcomeCoverage([source("a"), source("b")], report([row("a")], [])), /cover every selected source/);
  assert.throws(() => assertQualificationOutcomeCoverage([source("a")], report([row("a"), row("b")], [])), /cover every selected source/);
});

test("coverage rejects same-size wrong identity sets", () => {
  assert.throws(() => assertQualificationOutcomeCoverage([source("a")], report([row("b")], [])), /do not match selected sources/);
});
