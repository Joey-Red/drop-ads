import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("M1054 accessible-name resolution uses captured exact-receiver primitives", () => {
  assert.match(source, /function boundedDescendantText\(element/);
  assert.match(source, /const walker = createTreeWalker\(element, SHOW_TEXT\)/);
  assert.match(source, /const value = nodeValue\(node\)/);
  assert.match(source, /function labelledBySnapshot\(element\)/);
  assert.match(source, /const rawIds = elementAttribute\(element, "aria-labelledby"\)/);
  assert.match(source, /const root = nodeRoot\(element\)/);
  assert.match(source, /const target = rootElementById\(root, id\)/);
  assert.match(source, /const targetRoot = target \? nodeRoot\(target\) : null/);
  assert.match(source, /!nodeConnected\(target\)/);
  assert.match(source, /Reflect\.apply\(nativeDocumentGetElementById, document, \[id\]\)/);
  assert.match(source, /Reflect\.apply\(nativeShadowGetElementById, root, \[id\]\)/);
});

test("M1054 preserves same-root accessible-name bounds and refuses live DOM fallback", () => {
  for (const marker of [
    "MAX_ARIA_LABELLEDBY_IDS = 4",
    "MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256",
    "MAX_ARIA_REFERENCE_TEXT_NODES = 16",
    "MAX_ARIA_REFERENCE_RAW_CHARS = 256",
    "targetRoot !== root",
    "!labelReferenceSafe(target)"
  ]) assert.ok(source.includes(marker), `missing ${marker}`);
  assert.doesNotMatch(source, /root\.getElementById\(/);
  assert.doesNotMatch(source, /target\?\.getRootNode|element\.getRootNode/);
  assert.doesNotMatch(source, /target\.getAttribute|element\.getAttribute/);
});
