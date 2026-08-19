import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("M1045 captures action-context traversal and attribute primitives", () => {
  for (const marker of [
    'captureData(DocumentPrototype, "createTreeWalker")',
    'captureData(TreeWalkerPrototype, "nextNode")',
    'captureData(ElementPrototype, "getAttribute")',
    'captureData(ElementPrototype, "hasAttribute")',
    'captureGetter(ElementPrototype, "tagName")',
    'captureData(NodePrototype, "getRootNode")',
    'captureGetter(NodePrototype, "parentElement")',
    'captureGetter(ShadowRootPrototype, "host")',
    'captureData(ShadowRootPrototype, "getElementById")'
  ]) assert.ok(source.includes(marker), `missing primitive capture: ${marker}`);
  assert.match(source, /const SHOW_ELEMENT = ownDataValue\(NodeFilterObject, "SHOW_ELEMENT"\)/);
  assert.match(source, /Reflect\.apply\(nativeCreateTreeWalker, document, \[element, SHOW_ELEMENT\]\)/);
});

test("M1045 action-context safety avoids live DOM traversal and attribute methods", () => {
  assert.doesNotMatch(source, /document\.createTreeWalker|walker\.nextNode\(|element\?\.getAttribute|element\.getAttribute|element\?\.hasAttribute|element\?\.getRootNode|element\?\.parentElement|root\.getElementById/);
  assert.match(source, /MAX_ACTIVATION_ANCESTOR_STEPS = 16/);
  assert.match(source, /MAX_EDITABLE_ANCESTOR_STEPS = 16/);
  assert.match(source, /MAX_CONTEXT_DESCENDANT_ELEMENTS = 128/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
