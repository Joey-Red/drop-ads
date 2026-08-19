import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M842 selector generation uses one bounded uniqueness-probe budget", () => {
  assert.ok(source.includes("const MAX_UNIQUENESS_PROBES = 32;"));
  assert.ok(source.includes("let uniquenessProbeCount = 0;"));
  assert.ok(source.includes("uniquenessProbeCount += 1;"));
  assert.ok(source.includes("if (uniquenessProbeCount > MAX_UNIQUENESS_PROBES) throw new Error(\"Picker selector uniqueness probe limit exceeded\");"));
  assert.ok(source.includes("for (const candidate of directCandidates) if (probe(documentRef, candidate, element)) return candidate;"));
  assert.ok(source.includes("stableIdIsUnique(current, documentRef, probe)"));
  assert.ok(source.includes("probe(documentRef, selector, element)"));
});
