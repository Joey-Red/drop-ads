import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("removing an allow override restores focus after rerender", () => {
  assert.match(source, /let pendingOverrideRuleKey = null/);
  assert.match(source, /function handlePersonalBlockClick\(event\)/);
  assert.match(source, /pendingOverrideRuleKey = key/);
  assert.match(source, /function restoreOverrideFocus\(\)/);
  assert.match(source, /candidate\.dataset\.ruleKey === key/);
  assert.match(source, /button\.secondary-action, button\.remove/);
  assert.match(source, /pendingOverrideRuleKey = null/);
  assert.match(source, /personalBlockList\?\.removeEventListener\("click", handlePersonalBlockClick, true\)/);
});
