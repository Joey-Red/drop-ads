import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M845 only admits unique ancestor ids", () => {
  assert.match(source, /function stableIdIsUnique\(element, documentRef, probe = unique\)/);
  assert.match(source, /return Boolean\(id\) && probe\(documentRef, `#\$\{cssEscape\(id\)\}`, element\)/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /const part = nthPart\(current, includeId\)/);
});
