import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner executor captures the native click primitive through data descriptors", () => {
  assert.match(source, /const MAX_PLATFORM_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureData\(receiver, key\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /const HTMLElementCtor = captureData\(globalThis, "HTMLElement"\)/);
  assert.match(source, /captureData\(HTMLElementCtor, "prototype"\)/);
  assert.match(source, /captureData\(HTMLElementPrototype, "click"\)/);
  assert.match(source, /typeof nativeClick !== "function"/);
  assert.match(source, /Reflect\.apply\(nativeClick, snapshot\.element, \[\]\)/);
  assert.doesNotMatch(source, /Reflect\.apply\(nativeClick, candidate\.element/);
  assert.doesNotMatch(source, /HTMLElement\?\.prototype\?\.click|HTMLElement\.prototype\.click/);
  assert.doesNotMatch(source, /new MouseEvent|dispatchEvent|scrollIntoView/);
});
