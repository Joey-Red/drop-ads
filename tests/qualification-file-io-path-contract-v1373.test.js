import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  revalidateQualificationUtf8FilePath,
  snapshotQualificationPathReadOptions,
  snapshotQualificationUtf8FilePath
} from "../tools/qualification-file-io.mjs";

test("M1373 pathname options reject accessors without invoking them", () => {
  let getterCalls = 0;
  const options = {};
  Object.defineProperty(options, "allowMissing", { enumerable: true, get() { getterCalls += 1; return true; } });
  assert.throws(() => snapshotQualificationPathReadOptions(options), /own data field/);
  assert.equal(getterCalls, 0);
  assert.throws(() => snapshotQualificationPathReadOptions({ allowMissing: false, extra: true }), /fields are invalid/);
});

test("M1373 pathname identity revalidation consumes an exact data snapshot", async () => {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qpath-"));
  try {
    const path = join(root, "sample.txt");
    await writeFile(path, "ok\n", "utf8");
    const snapshot = await snapshotQualificationUtf8FilePath(path, { label: "sample" });
    assert.equal(Object.isFrozen(snapshot), true);
    assert.equal(Object.isFrozen(snapshot.identity), true);
    assert.equal(await revalidateQualificationUtf8FilePath(snapshot, "sample"), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("M1373 revalidation refuses accessor-bearing snapshots without getter execution", async () => {
  let getterCalls = 0;
  const snapshot = { path: "/tmp/never-read", identity: {} };
  Object.defineProperty(snapshot, "missing", { enumerable: true, get() { getterCalls += 1; return false; } });
  await assert.rejects(() => revalidateQualificationUtf8FilePath(snapshot), /own data field/);
  assert.equal(getterCalls, 0);
});
