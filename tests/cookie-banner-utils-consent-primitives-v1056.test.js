import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("M1056 consent context uses captured metadata and text traversal", () => {
  assert.match(source, /function boundedConsentContext\(element\)/);
  assert.match(source, /elementAttribute\(element, "aria-label"\)/);
  assert.match(source, /elementAttribute\(element, "title"\)/);
  assert.match(source, /elementId\(element\)/);
  assert.match(source, /elementClassName\(element\)/);
  assert.match(source, /const walker = createTreeWalker\(element, SHOW_TEXT\)/);
  assert.match(source, /append\(nodeValue\(node\)\)/);
});

test("M1056 consent ancestry uses captured document roots and parentElement", () => {
  assert.match(source, /function findConsentContainer\(element, budget = null\)/);
  assert.match(source, /const body = documentBody\(\)/);
  assert.match(source, /const root = documentElement\(\)/);
  assert.match(source, /current = parentElement\(current\)/);
  assert.doesNotMatch(source, /current\.parentElement/);
  assert.doesNotMatch(source, /document\.body|document\.documentElement/);
});

test("M1056 preserves consent work ceilings and transient privacy", () => {
  for (const marker of [
    "MAX_CONSENT_ANCESTOR_STEPS = 10",
    "MAX_CONSENT_TEXT_NODES = 96",
    "MAX_CONSENT_CONTEXT_CHARS = 1_200",
    "MAX_CONSENT_RAW_FIELD_CHARS = 2_400",
    "MAX_CONSENT_CONTEXT_EVALUATIONS = 256"
  ]) assert.ok(source.includes(marker), `missing ${marker}`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
