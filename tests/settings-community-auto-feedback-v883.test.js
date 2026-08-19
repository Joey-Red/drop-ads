import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/community-ui.js", import.meta.url), "utf8");

test("automatic community feedback is scoped to the local block form transaction", () => {
  assert.match(source, /blockForm\?\.addEventListener\("submit", beginAutomaticCommunityFeedback, true\)/);
  assert.match(source, /pendingAutoBaseline = ruleKeys\(\)/);
  assert.match(source, /blockSubmitObserver\.observe\(blockSubmit, \{ attributes: true, attributeFilter: \["disabled"\] \}\)/);
  assert.match(source, /This rule stays local and is not eligible for community submission/);
  assert.match(source, /Local block is active; the optional community draft could not be opened/);
  assert.match(source, /Local block is active; a GitHub draft was opened for review\. Nothing was submitted automatically/);
  assert.match(source, /blockForm\?\.removeEventListener\("submit", beginAutomaticCommunityFeedback, true\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/);
});
