import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("direct and visible cookie-banner action names must agree", () => {
  assert.match(safety, /function directAndVisibleNamesAgree\(element\)/);
  assert.match(safety, /visible = completeDescendantText\(element, MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS\)/);
  assert.match(safety, /directNormalized = Reflect\.apply\(normalizedActionText, undefined, \[direct\]\)/);
  assert.match(safety, /visibleNormalized = Reflect\.apply\(normalizedActionText, undefined, \[visible\]\)/);
  assert.match(safety, /directNormalized === visibleNormalized/);
  assert.match(safety, /!directAndVisibleNamesAgree\(element\)/);
});
