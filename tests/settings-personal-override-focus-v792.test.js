import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("allow-override removal restores focus after committed personal-list rerender", () => {
  assert.match(source, /let pendingOverrideRuleKey = null/);
  assert.match(source, /action\.textContent !== "Remove allow override"/);
  assert.match(source, /pendingOverrideRuleKey = key/);
  assert.match(source, /function restoreOverrideFocus\(\)/);
  assert.match(source, /row\?\.querySelector\("button\.secondary-action, button\.remove"\)/);
  assert.match(source, /else personalBlockInput\?\.focus\(\)/);
  assert.match(source, /if \(pendingOverrideRuleKey && hasChildListChange\) restoreOverrideFocus\(\)/);
  assert.match(source, /pendingOverrideRuleKey = null;/);
});
