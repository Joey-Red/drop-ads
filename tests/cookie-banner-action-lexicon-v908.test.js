import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("automatic cookie rejection uses exact reviewed normalized labels", () => {
  assert.match(source, /Object\.freeze\(\["reject all", 100\]\)/);
  assert.match(source, /Object\.freeze\(\["reject optional cookies", 98\]\)/);
  assert.match(source, /Object\.freeze\(\["refuse all", 96\]\)/);
  assert.match(source, /Object\.freeze\(\["continue without accepting", 88\]\)/);
  assert.match(source, /Object\.freeze\(\["only necessary cookies", 86\]\)/);
  assert.match(source, /if \(text === phrase\) return score/);
  assert.doesNotMatch(source, /text\.startsWith\(`\$\{phrase\}/);
  assert.doesNotMatch(source, /text\.endsWith\(`/);
});

test("accept/manage/customization language remains ineligible", () => {
  assert.match(source, /AMBIGUOUS_OR_POSITIVE/);
  assert.match(source, /accept/);
  assert.match(source, /manage/);
  assert.match(source, /preferences\?/);
  assert.match(source, /customize/);
  assert.match(source, /personalize/);
  assert.match(source, /if \(!text \|\| AMBIGUOUS_OR_POSITIVE\.test\(text\)\) return 0/);
});
