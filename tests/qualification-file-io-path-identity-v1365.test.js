import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readQualificationUtf8File,
  snapshotQualificationUtf8FilePath,
  revalidateQualificationUtf8FilePath
} from "../tools/qualification-file-io.mjs";

test("M1365 reads a stable regular pathname through identity-safe bounded I/O", async () => {
  const dir = await mkdtemp(join(tmpdir(), "drop-ads-qualification-read-"));
  const path = join(dir, "record.json");
  try {
    await writeFile(path, "{}\n", "utf8");
    const snapshot = await snapshotQualificationUtf8FilePath(path, { label: "record" });
    assert.ok(Object.isFrozen(snapshot));
    assert.ok(Object.isFrozen(snapshot.identity));
    assert.equal(await revalidateQualificationUtf8FilePath(snapshot, "record"), true);
    assert.equal(await readQualificationUtf8File(path, { maxBytes: 32, label: "record" }), "{}\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("M1365 refuses symlink qualification inputs", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "drop-ads-qualification-link-"));
  const target = join(dir, "target.json");
  const link = join(dir, "link.json");
  try {
    await writeFile(target, "{}\n", "utf8");
    try { await symlink(target, link); }
    catch (error) {
      if (["EPERM", "EACCES", "ENOSYS"].includes(error?.code)) return t.skip("symlink creation unavailable");
      throw error;
    }
    await assert.rejects(() => readQualificationUtf8File(link, { maxBytes: 32, label: "record" }), /regular non-symlink file/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("M1365 preserves allowMissing null semantics", async () => {
  const dir = await mkdtemp(join(tmpdir(), "drop-ads-qualification-missing-"));
  try {
    assert.equal(await readQualificationUtf8File(join(dir, "missing.json"), { maxBytes: 32, allowMissing: true }), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
