import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { qualificationRecordOutputPath, writeQualificationRecordAtomic } from "../tools/qualification-record-io.mjs";

test("qualification record atomic writer persists exact text inside the repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qual-record-"));
  try {
    const text = '{"schemaVersion":4}\n';
    const output = await writeQualificationRecordAtomic(root, "artifacts/qualification-record.json", text);
    assert.equal(await readFile(output, "utf8"), text);
    assert.equal(output, qualificationRecordOutputPath(root, "artifacts/qualification-record.json"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("qualification record output rejects repository escape", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qual-record-escape-"));
  try {
    assert.throws(() => qualificationRecordOutputPath(root, "../outside.json"), /stay inside/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("qualification record output rejects symlink parents", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qual-record-link-"));
  const outside = await mkdtemp(join(tmpdir(), "drop-ads-qual-record-outside-"));
  try {
    await symlink(outside, join(root, "artifacts"));
    await assert.rejects(
      () => writeQualificationRecordAtomic(root, "artifacts/qualification-record.json", "{}\n"),
      /real directory/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
