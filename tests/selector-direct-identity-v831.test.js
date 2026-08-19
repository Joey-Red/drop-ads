import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M831 direct picker selectors require identity beyond a bare tag", () => {
  assert.match(source, /function selectorCarriesIdentity\(part, element\)/);
  assert.match(source, /return Boolean\(part\) && part !== elementTag\(element\);/);
  assert.match(source, /function directIdentityCandidates\(element, includeId = true\)/);
  assert.doesNotMatch(source, /candidates\.push\(tag\)/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate;/);
  assert.match(source, /if \(\(parts\.length > 1 \|\| selectorCarriesIdentity\(part, current\)\) && probe\(documentRef, selector, element\)\) return selector;/);
});
