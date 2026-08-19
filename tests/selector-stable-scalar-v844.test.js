import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 picker scalar identity requires stable repeated reads", () => {
  assert.match(source, /function stableStringProperty\(element, property\)/);
  assert.match(source, /const first = element\?\.\[property\];/);
  assert.match(source, /const second = element\?\.\[property\];/);
  assert.match(source, /if \(typeof first !== "string" \|\| first !== second\) return null;/);
  assert.match(source, /stableStringProperty\(element, "localName"\)/);
  assert.match(source, /stableStringProperty\(element, "tagName"\)/);
  assert.match(source, /stableStringProperty\(element, "id"\)/);
});
