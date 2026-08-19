import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("M1053 captures base cookie-banner DOM collaborators through descriptors", () => {
  for (const marker of [
    'captureData(DocumentPrototype, "createTreeWalker")',
    'captureData(TreeWalkerPrototype, "nextNode")',
    'captureGetter(NodePrototype, "nodeValue")',
    'captureData(NodePrototype, "getRootNode")',
    'captureGetter(NodePrototype, "parentElement")',
    'captureGetter(NodePrototype, "isConnected")',
    'captureData(ElementPrototype, "getAttribute")',
    'captureData(ElementPrototype, "hasAttribute")',
    'captureGetter(ElementPrototype, "tagName")',
    'captureGetter(ElementPrototype, "shadowRoot")',
    'captureData(ElementPrototype, "closest")',
    'captureGetter(HTMLInputElementPrototype, "value")',
    'captureGetter(HTMLButtonElementPrototype, "form")'
  ]) assert.ok(source.includes(marker), `missing captured primitive ${marker}`);
  assert.match(source, /Reflect\.apply\(nativeCreateTreeWalker, document, \[root, whatToShow\]\)/);
  assert.match(source, /Reflect\.apply\(nativeTreeWalkerNextNode, walker, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowRootGetter, element, \[\]\)/);
});

test("M1053 removes live DOM calls from protected base utility paths", () => {
  assert.doesNotMatch(source, /document\.createTreeWalker\(/);
  assert.doesNotMatch(source, /walker\.nextNode\(/);
  assert.doesNotMatch(source, /\.getRootNode\?\.\(/);
  assert.doesNotMatch(source, /\.getAttribute\?\.\(/);
  assert.doesNotMatch(source, /\.hasAttribute\?\.\(/);
  assert.doesNotMatch(source, /\.closest\?\.\(/);
  assert.doesNotMatch(source, /instanceof HTMLInputElement|instanceof HTMLButtonElement/);
});

test("M1053 remains bounded and privacy-minimal", () => {
  for (const marker of ["MAX_COOKIE_BANNER_SCAN_NODES = 2_000", "MAX_COOKIE_BANNER_CANDIDATES = 64", "MAX_CONSENT_TEXT_NODES = 96", "MAX_COOKIE_BANNER_SHADOW_ROOTS = 32", "MAX_COOKIE_BANNER_SHADOW_DEPTH = 4"]) assert.ok(source.includes(marker));
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages/i);
});
