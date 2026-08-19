import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("descendant action labels must fit completely inside bounded work", () => {
  assert.match(safety, /const MAX_ACTION_TEXT_NODES = 32/);
  assert.match(safety, /visited > maxNodes/);
  assert.match(safety, /raw\.length \+ value\.length \+ 1 > maxRawChars/);
  assert.match(safety, /completeDescendantText\(element, MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS\)/);
  assert.match(safety, /normalizedLength\(raw\) <= MAX_ACTION_TEXT_CHARS/);
  assert.match(safety, /if \(direct\) return true/);
  assert.match(safety, /!descendantSourceWithinBounds\(element\)/);
});
