import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner action text extraction is bounded before normalization", () => {
  assert.match(source, /const MAX_COOKIE_BANNER_TEXT_CHARS = 160/);
  assert.match(source, /const MAX_ACTION_TEXT_NODES = 32/);
  assert.match(source, /const MAX_ACTION_RAW_CHARS = 512/);
  assert.match(source, /function normalizeBoundedText\(value, maxRawChars, maxOutputChars\)/);
  assert.match(source, /value\.slice\(0, maxRawChars\)/);
  assert.match(source, /const walker = createTreeWalker\(element, SHOW_TEXT\)/);
  assert.match(source, /while \(visited < maxNodes && raw\.length < maxRawChars\)/);
  assert.match(source, /const value = nodeValue\(node\)/);
  assert.match(source, /value\.slice\(0, remaining\)/);
  assert.doesNotMatch(source, /document\.createTreeWalker\(|walker\.nextNode\(|element\.innerText|element\.textContent/);
});
