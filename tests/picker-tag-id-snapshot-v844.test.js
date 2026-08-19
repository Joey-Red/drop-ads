import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 picker tag and id reads require stable repeated values", () => {
  assert.match(source, /function stableStringProperty\(element, property\)/);
  assert.match(source, /const first = element\?\.\[property\];[\s\S]*const second = element\?\.\[property\];/);
  assert.match(source, /typeof first !== "string" \|\| first !== second/);
  assert.match(source, /stableStringProperty\(element, "localName"\)/);
  assert.match(source, /stableStringProperty\(element, "tagName"\)/);
  assert.match(source, /stableStringProperty\(element, "id"\)/);
});
