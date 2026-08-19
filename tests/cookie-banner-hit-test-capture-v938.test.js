import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner executor captures hit-test and containment primitives", () => {
  assert.match(source, /function captureGetter\(receiver, key\)/);
  assert.match(source, /captureGetter\(ElementPrototype, "shadowRoot"\)/);
  assert.match(source, /captureData\(document, "elementFromPoint"\)/);
  assert.match(source, /captureData\(NodePrototype, "contains"\)/);
  assert.match(source, /Reflect\.apply\(nativeDocumentElementFromPoint, document, \[x, y\]\)/);
  assert.match(source, /captureData\(shadowRoot, "elementFromPoint"\)/);
  assert.match(source, /Reflect\.apply\(shadowElementFromPoint, shadowRoot, \[x, y\]\)/);
  assert.match(source, /Reflect\.apply\(nativeContains, container, \[node\]\)/);
  assert.doesNotMatch(source, /document\.elementFromPoint\(/);
  assert.doesNotMatch(source, /\.contains\(hit\)|consentRoot\.contains\(/);
});
