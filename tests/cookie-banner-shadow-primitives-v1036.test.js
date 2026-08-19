import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-shadow-roots.js", import.meta.url), "utf8");

test("M1036 captures open-shadow discovery DOM primitives through descriptors", () => {
  assert.match(source, /const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /captureData\(document, "createTreeWalker"\)/);
  assert.match(source, /captureData\(TreeWalkerPrototype, "nextNode"\)/);
  assert.match(source, /captureGetter\(ElementPrototype, "shadowRoot"\)/);
  assert.match(source, /Reflect\.apply\(nativeCreateTreeWalker, document/);
  assert.match(source, /Reflect\.apply\(nativeTreeWalkerNextNode, walker/);
  assert.match(source, /Reflect\.apply\(nativeShadowRootGetter, element/);
});

test("M1036 preserves bounded work and immutable helper publication", () => {
  assert.match(source, /const MAX_SHADOW_SCAN_NODES = 2_000;/);
  assert.match(source, /const MAX_OPEN_SHADOW_ROOTS = 32;/);
  assert.match(source, /const MAX_OPEN_SHADOW_DEPTH = 4;/);
  assert.match(source, /return Object\.freeze\(roots\)/);
  assert.match(source, /Object\.defineProperty\(globalThis, SHADOW_ROOTS_GLOBAL/);
  assert.match(source, /writable: false/);
  assert.match(source, /configurable: false/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
