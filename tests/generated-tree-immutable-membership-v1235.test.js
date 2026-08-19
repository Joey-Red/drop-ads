import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("M1235 uses frozen sorted allowlist arrays for generated-tree membership", async () => {
  const source = await readFile(resolve(root, "tools/artifact-audit.mjs"), "utf8");
  assert.match(source, /function sortedGeneratedPathMembershipHas\(sortedPaths, value\)/);
  assert.match(source, /return snapshotGeneratedAllowlist\(browser\);/);
  assert.match(source, /sortedGeneratedPathMembershipHas\(membership\.directories, normalized\)/);
  assert.match(source, /sortedGeneratedPathMembershipHas\(membership\.files, normalized\)/);
  assert.doesNotMatch(source, /files:\s*new Set\(GENERATED_TREE_ALLOWLISTS/);
  assert.doesNotMatch(source, /directories:\s*new Set\(GENERATED_TREE_ALLOWLISTS/);
});
