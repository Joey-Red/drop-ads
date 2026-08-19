import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const boundary = fs.readFileSync(new URL("../src/core/community-boundary.js", import.meta.url), "utf8");
const community = fs.readFileSync(new URL("../src/core/community.js", import.meta.url), "utf8");

test("M873 runtime community contribution uses the exact descriptor-safe rule snapshot boundary", () => {
  assert.match(boundary, /COMMUNITY_RULE_KEYS = Object\.freeze\(\["kind", "value", "resourceTypes"\]\)/);
  assert.match(boundary, /assertPlainExactObject\(rule, "Community candidate rule", COMMUNITY_RULE_KEY_SET\)/);
  assert.match(boundary, /readPlainDataField\(rule, key\)/);
  assert.match(boundary, /must include kind and value/);
  assert.match(boundary, /return Object\.freeze\(snapshot\)/);
  assert.match(community, /normalizeRule\(snapshotCommunityRuleInput\(rule\)\)/);
});
