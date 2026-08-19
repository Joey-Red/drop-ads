import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readCommunityListFile, writeCommunityListFileAtomic } from "../tools/community-file-io.mjs";

async function withTempFile(initial, task) {
  const dir = await mkdtemp(join(tmpdir(), "drop-ads-community-v875-"));
  const path = join(dir, "default.txt");
  try {
    await writeFile(path, initial);
    await task(path);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("M875 reads and atomically writes canonical LF community-list text", async () => {
  await withTempFile("# community\n", async (path) => {
    assert.equal(await readCommunityListFile(path), "# community\n");
    await writeCommunityListFileAtomic(path, "# community\nblock domain ads.example.com\n");
    assert.equal(await readFile(path, "utf8"), "# community\nblock domain ads.example.com\n");
  });
});

test("M875 rejects BOM, NUL, carriage returns, and missing final LF", async () => {
  for (const invalid of ["\uFEFF# community\n", "# community\0\n", "# community\r\n", "# community"]) {
    await withTempFile("# community\n", async (path) => {
      await assert.rejects(() => writeCommunityListFileAtomic(path, invalid));
    });
  }
});

test("M875 rejects noncanonical file bytes on read", async () => {
  for (const invalid of [Buffer.from([0xef, 0xbb, 0xbf, 0x23, 0x0a]), Buffer.from("# x\r\n"), Buffer.from("# x"), Buffer.from([0xff])]) {
    await withTempFile(invalid, async (path) => {
      await assert.rejects(() => readCommunityListFile(path));
    });
  }
});
