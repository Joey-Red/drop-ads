import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeBuildOutputTextAtomic } from "../tools/build-output-io.mjs";

test("build output writer atomically writes repository-contained dist text", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-output-"));
  try {
    await mkdir(join(root, "dist", "chromium"), { recursive: true });
    const result = await writeBuildOutputTextAtomic(root, "dist/chromium/build-info.json", "{\"ok\":true}\n");
    assert.equal(await readFile(result.path, "utf8"), "{\"ok\":true}\n");
    assert.equal(result.bytes, 12);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("build output writer rejects paths outside dist and symlink parents", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-output-"));
  try {
    await mkdir(join(root, "dist"), { recursive: true });
    await mkdir(join(root, "real"), { recursive: true });
    await assert.rejects(() => writeBuildOutputTextAtomic(root, "outside.json", "x"), /under dist/);
    await symlink(join(root, "real"), join(root, "dist", "linked"), "dir");
    await assert.rejects(() => writeBuildOutputTextAtomic(root, "dist/linked/file.json", "x"), /real directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
