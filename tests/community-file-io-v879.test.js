import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readCommunityListFile, writeCommunityListFileAtomic } from "../tools/community-file-io.mjs";

test("community list file I/O reads stable canonical text and replaces atomically", async () => {
  const dir = await mkdtemp(join(tmpdir(), "drop-ads-community-"));
  const path = join(dir, "default.txt");
  try {
    await writeFile(path, "block domain ads.example\n", "utf8");
    assert.equal(await readCommunityListFile(path), "block domain ads.example\n");
    await writeCommunityListFileAtomic(path, "block domain ads.example\nblock domain tracker.example\n");
    assert.equal(await readFile(path, "utf8"), "block domain ads.example\nblock domain tracker.example\n");
    await assert.rejects(() => writeCommunityListFileAtomic(path, "block domain bad.example\r\n"), /LF line endings/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
