import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("M1223 binds a generated-tree audit to one stable root identity", async () => {
  const source = await readFile(resolve(root, "tools/artifact-audit.mjs"), "utf8");
  const auditStart = source.indexOf("export async function auditGeneratedTree");
  const rootSnapshot = source.indexOf("const rootIdentity = snapshotGeneratedDirectoryIdentity(rootStats, targetBrowser)", auditStart);
  const walk = source.indexOf("await walk(root)", rootSnapshot);
  const missing = source.indexOf("for (const path of expected)", walk);
  const finalRootCheck = source.indexOf("assertGeneratedRootIdentityUnchanged(rootIdentity, await lstat(root), targetBrowser)", missing);
  const success = source.indexOf("return { browser: targetBrowser", finalRootCheck);

  assert.match(source, /function assertGeneratedRootIdentityUnchanged\(before, after, browser\)/);
  assert.match(source, /generated extension root changed during tree audit/);
  assert.ok(auditStart >= 0);
  assert.ok(rootSnapshot > auditStart, "root identity must be snapshotted before traversal");
  assert.ok(walk > rootSnapshot, "traversal must occur after the root snapshot");
  assert.ok(missing > walk, "required-member validation must occur after traversal");
  assert.ok(finalRootCheck > missing, "root identity must be revalidated after required-member validation");
  assert.ok(success > finalRootCheck, "audit success must follow the final root identity check");
});
