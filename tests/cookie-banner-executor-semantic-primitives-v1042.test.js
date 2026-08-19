import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("M1042 captures semantic and composed-ancestry DOM primitives", () => {
  for (const marker of [
    'captureData(ElementPrototype, "hasAttribute")',
    'captureData(ElementPrototype, "getAttribute")',
    'captureGetter(ElementPrototype, "tagName")',
    'captureData(NodePrototype, "getRootNode")',
    'captureGetter(NodePrototype, "parentElement")',
    'captureGetter(NodePrototype, "isConnected")',
    'captureGetter(ShadowRootPrototype, "host")',
    'captureGetter(HTMLElementPrototype, "hidden")',
    'captureGetter(HTMLFieldSetElementPrototype, "disabled")'
  ]) assert.ok(source.includes(marker), `missing captured primitive: ${marker}`);
  assert.match(source, /Reflect\.apply\(nativeGetRootNode, element, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeParentElementGetter, element, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowHostGetter, root, \[\]\)/);
  assert.match(source, /Reflect\.apply\(nativeIsConnectedGetter, node, \[\]\)/);
});

test("M1042 semantic availability avoids live DOM method and state reads", () => {
  assert.doesNotMatch(source, /current\.hasAttribute|current\.getAttribute|current\.hidden|element\?\.parentElement|element\?\.getRootNode|\.isConnected|instanceof HTMLFieldSetElement/);
  assert.match(source, /MAX_INTERACTION_ANCESTOR_STEPS = 24/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
