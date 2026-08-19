import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("M1043 captures style, rect, and viewport reads", () => {
  assert.match(source, /captureData\(CSSStyleDeclarationPrototype, "getPropertyValue"\)/);
  for (const key of ["left", "right", "top", "bottom", "width", "height"]) {
    assert.match(source, new RegExp(`captureGetter\\(DOMRectReadOnlyPrototype, "${key}"\\)`));
  }
  assert.match(source, /captureGetter\(globalThis, "innerWidth"\)/);
  assert.match(source, /captureGetter\(globalThis, "innerHeight"\)/);
  assert.match(source, /Reflect\.apply\(nativeStyleGetPropertyValue, style, \[property\]\)/);
  assert.match(source, /Reflect\.apply\(getter, rect, \[\]\)/);
  assert.match(source, /Reflect\.apply\(getter, globalThis, \[\]\)/);
});

test("M1043 visibility and hit testing avoid live style rect and viewport properties", () => {
  assert.doesNotMatch(source, /style\.(?:display|visibility|opacity|pointerEvents)|rect\.(?:left|right|top|bottom|width|height)|globalThis\.(?:innerWidth|innerHeight)/);
  assert.match(source, /Number\.isFinite\(value\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
