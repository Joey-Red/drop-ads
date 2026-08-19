import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("aria-labelledby action names must fit completely inside reviewed bounds", () => {
  assert.match(safety, /const MAX_ARIA_LABELLEDBY_IDS = 4/);
  assert.match(safety, /const MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256/);
  assert.match(safety, /const MAX_ARIA_REFERENCE_TEXT_NODES = 16/);
  assert.match(safety, /const MAX_ARIA_REFERENCE_RAW_CHARS = 256/);
  assert.match(safety, /ids\.length > MAX_ARIA_LABELLEDBY_IDS/);
  assert.match(safety, /completeDescendantText\(target, MAX_ARIA_REFERENCE_TEXT_NODES, MAX_ARIA_REFERENCE_RAW_CHARS\)/);
  assert.match(safety, /joined\.length \+ raw\.length > MAX_ACTION_RAW_CHARS/);
  assert.match(safety, /normalizedLength\(joined\) <= MAX_ACTION_TEXT_CHARS/);
  assert.match(safety, /!labelledBySourceWithinBounds\(element\)/);
});
