import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M976 refuses hidden naming text while allowing empty decorative descendants", () => {
  assert.match(source, /const MAX_HIDDEN_NAME_TEXT_NODES = 8;/);
  assert.match(source, /const MAX_HIDDEN_NAME_RAW_CHARS = 160;/);
  assert.match(source, /function hiddenNamingState\(element\)/);
  assert.match(source, /elementHasAttribute\(element, "hidden"\)/);
  assert.match(source, /elementHasAttribute\(element, "inert"\)/);
  assert.match(source, /elementAttribute\(element, "aria-hidden"\)/);
  assert.match(source, /function actionTreeExcludesHiddenText\(element\)/);
  assert.match(source, /hiddenText === null \|\| normalizedLength\(hiddenText\) > 0/);
  assert.match(source, /!actionTreeExcludesHiddenText\(element\)/);
});

test("M976 remains privacy-minimal", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics|telemetry/i);
});
