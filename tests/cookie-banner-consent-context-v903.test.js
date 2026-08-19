import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner candidates require bounded local consent context", () => {
  assert.match(source, /MAX_CONSENT_ANCESTOR_STEPS = 10/);
  assert.match(source, /MAX_CONSENT_TEXT_NODES = 96/);
  assert.match(source, /MAX_CONSENT_CONTEXT_CHARS = 1_200/);
  assert.match(source, /CONSENT_CONTEXT_PATTERN/);
  assert.match(source, /const body = documentBody\(\)/);
  assert.match(source, /const root = documentElement\(\)/);
  assert.match(source, /findConsentContainer\(node, consentBudget\)/);
  assert.match(source, /text && consentRoot/);
  assert.match(source, /Object\.freeze\(\{ element: node, text, consentRoot \}\)/);
});

test("consent-context inspection remains page-local, captured, and non-persistent", () => {
  assert.match(source, /const SHOW_TEXT = captureData\(NodeFilterObject, "SHOW_TEXT"\)/);
  assert.match(source, /const walker = createTreeWalker\(element, SHOW_TEXT\)/);
  assert.match(source, /append\(nodeValue\(node\)\)/);
  assert.doesNotMatch(source, /document\.body|document\.documentElement|current\.parentElement/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|runtime\.sendMessage|fetch\(|XMLHttpRequest|sendBeacon/);
  assert.doesNotMatch(source, /document\.body\.textContent|document\.documentElement\.textContent/);
});
