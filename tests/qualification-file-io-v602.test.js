import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readQualificationUtf8File } from "../tools/qualification-file-io.mjs";

async function withTempDir(run) {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qualification-file-"));
  try { await run(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test("bounded qualification reader accepts strict UTF-8 within the ceiling", async () => {
  await withTempDir(async (root) => {
    const path = join(root, "record.json");
    await writeFile(path, '{"schemaVersion":3}\n', "utf8");
    assert.equal(
      await readQualificationUtf8File(path, { maxBytes: 64, label: "record" }),
      '{"schemaVersion":3}\n'
    );
  });
});

test("bounded qualification reader rejects files over the byte ceiling", async () => {
  await withTempDir(async (root) => {
    const path = join(root, "record.json");
    await writeFile(path, "x".repeat(65), "utf8");
    await assert.rejects(
      readQualificationUtf8File(path, { maxBytes: 64, label: "record" }),
      /exceeds 64 bytes/
    );
  });
});

test("bounded qualification reader rejects malformed UTF-8 and empty files", async () => {
  await withTempDir(async (root) => {
    const invalid = join(root, "invalid.json");
    await writeFile(invalid, Buffer.from([0xc3, 0x28]));
    await assert.rejects(
      readQualificationUtf8File(invalid, { maxBytes: 64, label: "record" }),
      /strict UTF-8/
    );

    const empty = join(root, "empty.json");
    await writeFile(empty, Buffer.alloc(0));
    await assert.rejects(
      readQualificationUtf8File(empty, { maxBytes: 64, label: "record" }),
      /must not be empty/
    );
  });
});
