import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writePackageBinaryAtomic } from "../tools/package-output-io.mjs";

test("package binary writer atomically persists bounded bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-package-output-"));
  try {
    const parent = join(root, "dist");
    await mkdir(parent);
    const output = join(parent, "package.zip");
    const result = await writePackageBinaryAtomic(output, Buffer.from("zip"), { maxBytes: 16 });
    assert.equal(result.bytes, 3);
    assert.deepEqual(await readFile(output), Buffer.from("zip"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("package binary writer rejects oversized data and symlink parents", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-package-output-"));
  try {
    const parent = join(root, "real");
    await mkdir(parent);
    await assert.rejects(() => writePackageBinaryAtomic(join(parent, "x.zip"), Buffer.from("too-big"), { maxBytes: 2 }), /byte size/);
    await symlink(parent, join(root, "linked"), "dir");
    await assert.rejects(() => writePackageBinaryAtomic(join(root, "linked", "x.zip"), Buffer.from("x")), /real directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
