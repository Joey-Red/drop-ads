import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner executor captures style and geometry primitives", () => {
  assert.match(source, /const ElementCtor = captureData\(globalThis, "Element"\)/);
  assert.match(source, /captureData\(ElementCtor, "prototype"\)/);
  assert.match(source, /captureData\(ElementPrototype, "getBoundingClientRect"\)/);
  assert.match(source, /const nativeGetComputedStyle = captureData\(globalThis, "getComputedStyle"\)/);
  assert.match(source, /Reflect\.apply\(nativeGetComputedStyle, globalThis, \[element\]\)/);
  assert.match(source, /Reflect\.apply\(nativeGetBoundingClientRect, element, \[\]\)/);
  assert.doesNotMatch(source, /element\.getBoundingClientRect\(\)/);
  assert.doesNotMatch(source, /\bgetComputedStyle\(element\)/);
});
