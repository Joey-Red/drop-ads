import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner discovery shares one bounded consent-context budget", () => {
  assert.match(source, /const MAX_CONSENT_CONTEXT_EVALUATIONS = 256/);
  assert.match(source, /function createConsentContextBudget\(\)/);
  assert.match(source, /cache: new Map\(\), evaluations: 0/);
  assert.match(source, /budget\.cache\.has\(element\)/);
  assert.match(source, /budget\.evaluations >= MAX_CONSENT_CONTEXT_EVALUATIONS/);
  assert.match(source, /budget\.evaluations \+= 1/);
  assert.match(source, /const consentBudget = createConsentContextBudget\(\)/);
  assert.match(source, /findConsentContainer\(node, consentBudget\)/);
});
