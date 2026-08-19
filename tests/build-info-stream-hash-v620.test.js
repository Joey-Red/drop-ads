import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashBuildInputFile } from "../tools/build-info.mjs";

test("hashBuildInputFile streams exact bytes and SHA-256", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-hash-"));
  try {
    const path = join(root, "input.bin");
    const data = Buffer.alloc(200_000, 0x5a);
    await writeFile(path, data);
    const result = await hashBuildInputFile(path);
    assert.equal(result.bytes, data.byteLength);
    assert.equal(result.sha256, createHash("sha256").update(data).digest("hex"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hashBuildInputFile rejects symbolic links", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-build-hash-"));
  try {
    const target = join(root, "target.txt");
    const alias = join(root, "alias.txt");
    await writeFile(target, "safe\n");
    await symlink(target, alias);
    await assert.rejects(() => hashBuildInputFile(alias), /unsafe|symbolic/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
