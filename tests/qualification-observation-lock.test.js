import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  qualificationObservationLockPath,
  withQualificationObservationLock
} from "../tools/qualification-observation-lock.mjs";

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), "drop-ads-qualification-lock-"));
  await mkdir(join(root, "artifacts"));
  return root;
}

test("qualification observation lock is exclusive and metadata-free", async () => {
  const root = await temporaryRoot();
  let enter;
  let release;
  const entered = new Promise((resolve) => { enter = resolve; });
  const held = new Promise((resolve) => { release = resolve; });

  try {
    const first = withQualificationObservationLock(root, async () => {
      assert.deepEqual(await readdir(qualificationObservationLockPath(root)), []);
      enter();
      await held;
      return "first";
    });

    await entered;
    await assert.rejects(
      withQualificationObservationLock(root, async () => "second"),
      /qualification observation lock exists/
    );
    release();
    assert.equal(await first, "first");

    assert.equal(
      await withQualificationObservationLock(root, async () => "after-release"),
      "after-release"
    );
  } finally {
    release?.();
    await rm(root, { recursive: true, force: true });
  }
});

test("qualification observation lock is released when the task fails", async () => {
  const root = await temporaryRoot();
  try {
    await assert.rejects(
      withQualificationObservationLock(root, async () => { throw new Error("expected failure"); }),
      /expected failure/
    );
    assert.equal(await withQualificationObservationLock(root, async () => 7), 7);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
