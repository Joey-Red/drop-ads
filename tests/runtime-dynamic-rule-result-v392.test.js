import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M392 bounds and snapshots getDynamicRules results before capacity work", () => {
  assert.match(source, /const MAX_DYNAMIC_RULE_RESULT_ENTRIES = 100_000;/);
  assert.match(source, /function snapshotDynamicRuleEntries\(value\)/);
  assert.match(source, /snapshotDenseDataArray\(value, "Dynamic rule result", MAX_DYNAMIC_RULE_RESULT_ENTRIES\)/);
  assert.match(source, /Dynamic rule id must be a positive safe integer own data field/);
  assert.match(source, /Dynamic rule result contains duplicate ids/);
});

test("M392 apply, rollback, and UI verification classify managed rules through detached ids", () => {
  const uses = source.match(/snapshotDynamicRuleEntries\(await api\.declarativeNetRequest\.getDynamicRules\(\)\)/g) ?? [];
  assert.equal(uses.length, 3);
  assert.match(source, /currentEntries\.filter\(\(entry\) => isManagedRuleId\(entry\.id\)\)\.map\(\(entry\) => entry\.rule\)/);
  assert.match(source, /const unmanagedCount = currentEntries\.length - previousManaged\.length;/);
  assert.match(source, /const managedLoaded = currentEntries\.some\(\(entry\) => isManagedRuleId\(entry\.id\)\);/);
});
