import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M842 direct picker candidates use explicit identity before structural fallback", () => {
  const start = source.indexOf("function directIdentityCandidates(element, includeId = true)");
  const end = source.indexOf("function selectorCarriesIdentity", start);
  const body = source.slice(start, end);
  assert.ok(body.includes("candidates.push(`#${cssEscape(id)}`);"));
  assert.ok(body.includes("for (const attribute of stableAttributeSelectors(element)) candidates.push(`${tag}${attribute}`);"));
  assert.ok(body.includes("candidates.push(...stableClassSelectorCandidates(element, tag));"));
  assert.ok(body.indexOf("candidates.push(`#${cssEscape(id)}`);") < body.indexOf("stableAttributeSelectors"));
  assert.ok(body.indexOf("stableAttributeSelectors") < body.indexOf("stableClassSelectorCandidates"));
  assert.ok(!body.includes("candidates.push(tag)"));
});
