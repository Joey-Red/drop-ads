import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("M1063 captures document, root and readiness getters", () => {
  assert.match(source, /const documentGetter = captureGetter\(globalThis, "document"\)/);
  assert.match(source, /const pageDocument = readGetter\(documentGetter, globalThis\)/);
  assert.match(source, /const documentElementGetter = captureGetter\(pageDocument, "documentElement"\)/);
  assert.match(source, /const readyStateGetter = captureGetter\(pageDocument, "readyState"\)/);
  assert.match(source, /function currentDocumentElement\(\)/);
  assert.match(source, /function currentReadyState\(\)/);
  assert.match(source, /Reflect\.apply\(discoverActionCandidates, undefined, \[root\]\)/);
  assert.match(source, /Reflect\.apply\(collectOpenShadowRoots, undefined, \[root\]\)/);
});

test("M1063 binds listeners to the captured document and avoids live root/readiness reads", () => {
  assert.match(source, /captureMethod\(pageDocument, "addEventListener"\)/);
  assert.match(source, /captureMethod\(pageDocument, "removeEventListener"\)/);
  assert.doesNotMatch(source, /document\.documentElement|document\.readyState/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
