import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M830 exposes connected-target selector validation", () => {
  assert.match(source, /function selectorUniquelyIdentifies\(selector, element, documentRef = document\)/);
  assert.match(source, /if \(!isElementNode\(element\)\) return false/);
  assert.match(source, /if \(element\.isConnected !== true\) return false/);
  assert.match(source, /return unique\(documentRef, selector, element\)/);
  assert.match(source, /selectorUniquelyIdentifies,/);
});
