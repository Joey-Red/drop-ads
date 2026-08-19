import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describeReleaseFile } from "../tools/release-manifest.mjs";

test("describeReleaseFile streams exact bytes and SHA-256", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-release-hash-"));
  try {
    const path = join(root, "artifact.bin");
    const data = Buffer.alloc(180_000, 0x33);
    await writeFile(path, data);
    const result = await describeReleaseFile(path);
    assert.equal(result.bytes, data.length);
    assert.equal(result.sha256, createHash("sha256").update(data).digest("hex"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("describeReleaseFile rejects symlink inputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-release-hash-"));
  try {
    const target = join(root, "target.bin");
    const alias = join(root, "alias.bin");
    await writeFile(target, "payload");
    await symlink(target, alias);
    await assert.rejects(() => describeReleaseFile(alias), /regular non-symlink/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
