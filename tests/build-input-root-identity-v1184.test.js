import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { discoverBuildInputRoots } from "../tools/build-input-discovery.mjs";

const source = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");

test("M1184 requires an absolute normalized repository root before filesystem work", async () => {
  await assert.rejects(() => discoverBuildInputRoots("relative-root", []), /absolute normalized path|root directory set/i);
});

test("M1184 snapshots and revalidates repository-root identity around multi-root discovery", () => {
  assert.match(source, /const rootBefore = await requireDirectory\(repositoryRoot\)/);
  assert.match(source, /const rootAfter = await requireDirectory\(repositoryRoot\)/);
  assert.match(source, /sameDirectoryIdentity\(rootBefore, rootAfter\)/);
  assert.match(source, /repository root identity changed during discovery/);
  assert.match(source, /stat\.isSymbolicLink\(\) \|\| !stat\.isDirectory\(\)/);
});
