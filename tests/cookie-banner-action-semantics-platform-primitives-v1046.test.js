import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");

test("M1046 captures action-semantics DOM state primitives", () => {
  for (const marker of [
    'captureData(ElementPrototype, "getAttribute")',
    'captureData(ElementPrototype, "hasAttribute")',
    'captureGetter(ElementPrototype, "tagName")',
    'captureData(NodePrototype, "getRootNode")',
    'captureGetter(NodePrototype, "parentElement")',
    'captureGetter(ShadowRootPrototype, "host")',
    'captureGetter(HTMLButtonElementPrototype, "type")',
    'captureGetter(HTMLInputElementPrototype, "type")'
  ]) assert.ok(source.includes(marker), `missing primitive capture: ${marker}`);
  assert.match(source, /Reflect\.apply\(nativeButtonTypeGetter, element, \[\]\)|Reflect\.apply\(getter, element, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeGetRootNode, element, \[\]\)/);
});

test("M1046 semantic guards avoid live DOM attribute, type, and ancestry reads", () => {
  assert.doesNotMatch(source, /element\?\.hasAttribute|element\?\.getAttribute|current\.hasAttribute|current\.getAttribute|element\?\.tagName|element\?\.type|element\?\.parentElement|element\?\.getRootNode/);
  assert.match(source, /MAX_BUSY_ANCESTOR_STEPS = 16/);
  assert.match(source, /DECLARATIVE_COMMAND_ATTRIBUTES = Object\.freeze/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
