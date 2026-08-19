import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeStoredZip } from "../tools/deterministic-zip.mjs";

test("deterministic ZIP rejects symlink entries in the source tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-zip-tree-"));
  try {
    const source = join(root, "source");
    await mkdir(source);
    await writeFile(join(root, "outside.txt"), "outside\n");
    await symlink(join(root, "outside.txt"), join(source, "linked.txt"));
    await assert.rejects(() => makeStoredZip(source, join(root, "out.zip")), /non-regular filesystem entry|symlink/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deterministic ZIP rejects a symlink source root", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-zip-tree-"));
  try {
    const real = join(root, "real");
    await mkdir(real);
    await writeFile(join(real, "file.txt"), "ok\n");
    const linked = join(root, "linked");
    await symlink(real, linked, "dir");
    await assert.rejects(() => makeStoredZip(linked, join(root, "out.zip")), /source root must be a real directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
