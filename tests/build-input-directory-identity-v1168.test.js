import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");

test("M1168 binds recursive traversal to fresh directory identity", () => {
  assert.match(source, /function sameDirectoryIdentity\(left, right\)/);
  assert.match(source, /async function requireDirectory\(path, expected = null\)/);
  assert.match(source, /expected && !sameDirectoryIdentity\(expected, stat\)/);
  assert.match(source, /const before = await requireDirectory\(current, expected\)/);
  assert.match(source, /classified\.type === "directory"\) await walk\(path, classified\.stat\)/);
});

test("M1168 revalidates each directory after bounded traversal", () => {
  assert.match(source, /const after = await requireDirectory\(current\)/);
  assert.match(source, /!sameDirectoryIdentity\(before, after\)/);
  assert.match(source, /directory identity changed during build-input discovery/);
  assert.match(source, /left\.mtimeMs !== right\.mtimeMs/);
  assert.match(source, /left\.ctimeMs !== right\.ctimeMs/);
});
