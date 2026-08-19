import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M1044 captures action-source traversal, attribute, root, and input primitives", () => {
  for (const marker of [
    'captureData(DocumentPrototype, "createTreeWalker")',
    'captureData(TreeWalkerPrototype, "nextNode")',
    'captureData(ElementPrototype, "getAttribute")',
    'captureData(ElementPrototype, "hasAttribute")',
    'captureGetter(ElementPrototype, "tagName")',
    'captureGetter(NodePrototype, "nodeValue")',
    'captureData(NodePrototype, "getRootNode")',
    'captureGetter(NodePrototype, "parentElement")',
    'captureGetter(ShadowRootPrototype, "host")',
    'captureData(ShadowRootPrototype, "getElementById")',
    'captureGetter(HTMLInputElementPrototype, "value")'
  ]) assert.ok(source.includes(marker), `missing primitive capture: ${marker}`);
  assert.match(source, /const SHOW_TEXT = ownDataValue\(NodeFilterObject, "SHOW_TEXT"\)/);
  assert.match(source, /const SHOW_ELEMENT = ownDataValue\(NodeFilterObject, "SHOW_ELEMENT"\)/);
});

test("M1044 action-source paths invoke captured primitives instead of live DOM methods", () => {
  assert.match(source, /Reflect\.apply\(nativeCreateTreeWalker, document, \[root, whatToShow\]\)/);
  assert.match(source, /Reflect\.apply\(nativeTreeWalkerNextNode, walker, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeGetAttribute, element, \[name\]\)/);
  assert.match(source, /Reflect\.apply\(nativeGetRootNode, node, \[\]\)/);
  assert.doesNotMatch(source, /document\.createTreeWalker|walker\.nextNode\(|element\?\.getAttribute|element\?\.hasAttribute|element\?\.getRootNode|element\?\.parentElement|instanceof HTMLInputElement/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
