import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/community-ui.js", import.meta.url), "utf8");

test("manual community preparation has privacy-minimal start/success/failure feedback", () => {
  assert.match(source, /Opening a GitHub draft for your review/);
  assert.match(source, /GitHub draft opened for review\. Nothing was submitted automatically/);
  assert.match(source, /Community draft could not be opened\. Your local block remains active/);
  assert.match(source, /attributeFilter: \["disabled"\]/);
  assert.match(source, /pendingManualAction = null/);
  assert.doesNotMatch(source, /communityStatus\.textContent = .*blockError\.textContent/);
});
