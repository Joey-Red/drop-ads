import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M973 bounds and rejects unsafe descendants inside labelledby targets", () => {
  assert.match(source, /const MAX_ARIA_REFERENCE_ELEMENT_NODES = 64;/);
  assert.match(source, /function namingElementUnsafe\(element\)/);
  assert.match(source, /\["a", "area", "button", "input", "select", "textarea", "option", "summary"\]/);
  assert.match(source, /role === "button" \|\| role === "link"/);
  assert.match(source, /function referencedLabelTreeSafe\(target\)/);
  assert.match(source, /visited > MAX_ARIA_REFERENCE_ELEMENT_NODES/);
  assert.match(source, /!referencedLabelTreeSafe\(target\)/);
});

test("M973 does not add retention or network escape surfaces", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics|telemetry/i);
});
