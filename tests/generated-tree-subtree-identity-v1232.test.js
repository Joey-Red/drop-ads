import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/artifact-audit.mjs", import.meta.url), "utf8");

test("M1232 binds each generated directory across its complete subtree walk", () => {
  const walk = source.indexOf("async function walk(current)");
  const snapshot = source.indexOf("const subtreeIdentity = snapshotGeneratedDirectoryIdentity(await lstat(current), targetBrowser)", walk);
  const enumerate = source.indexOf("readGeneratedDirectoryBounded(current, targetBrowser)", snapshot);
  const recurse = source.indexOf("if (type === \"directory\") await walk(absolute)", enumerate);
  const revalidate = source.indexOf("assertGeneratedSubtreeDirectoryIdentityUnchanged(subtreeIdentity, await lstat(current), targetBrowser)", recurse);
  assert.ok(walk >= 0);
  assert.ok(snapshot > walk);
  assert.ok(enumerate > snapshot);
  assert.ok(recurse > enumerate);
  assert.ok(revalidate > recurse, "directory identity must be revalidated after descendants complete");
  assert.match(source, /generated extension directory changed during subtree traversal/);
});
