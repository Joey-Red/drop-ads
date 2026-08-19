import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner activation requires a visible hit-test-owned control", () => {
  assert.match(source, /styleValue\(style, "pointer-events"\)/);
  assert.match(source, /pointerEvents === "none"/);
  assert.match(source, /captureData\(document, "elementFromPoint"\)/);
  assert.match(source, /const left = Math\.max\(0, rectLeft\)/);
  assert.match(source, /const right = Math\.min\(viewportWidth, rectRight\)/);
  assert.match(source, /const top = Math\.max\(0, rectTop\)/);
  assert.match(source, /const bottom = Math\.min\(viewportHeight, rectBottom\)/);
  assert.match(source, /Reflect\.apply\(nativeDocumentElementFromPoint, document, \[x, y\]\)/);
  assert.match(source, /hit === element \|\| nodeContains\(element, hit\)/);
  assert.match(source, /if \(!hitTestOwnsAction\(element\)\) return false/);
});

test("cookie-banner activation does not scroll or synthesize event objects", () => {
  assert.doesNotMatch(source, /scrollIntoView|window\.scroll|document\.createEvent|new MouseEvent|dispatchEvent/);
  assert.match(source, /Reflect\.apply\(nativeClick, snapshot\.element, \[\]\)/);
});
