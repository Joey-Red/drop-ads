import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { auditSourceTree, validateSourceEntry } from "../tools/source-tree-audit.mjs";

test("directories and regular files are the only accepted entry types", () => {
  assert.equal(validateSourceEntry("src", "directory"), null);
  assert.equal(validateSourceEntry("src/background.js", "file"), null);
  for (const type of ["symlink", "socket", "fifo", "block-device", "character-device", "unknown"]) {
    assert.match(validateSourceEntry("src/bad", type), new RegExp(type));
  }
});

test("source indirection is rejected with repository-relative paths", () => {
  assert.equal(
    validateSourceEntry("src/core/runtime.js", "symlink"),
    "src/core/runtime.js: symlink filesystem entry is forbidden in release inputs"
  );
});

test("current release source tree contains only regular files/directories", async () => {
  const root = resolve(import.meta.dirname, "..");
  const result = await auditSourceTree(root);
  assert.ok(result.regularFiles > 0);
});
