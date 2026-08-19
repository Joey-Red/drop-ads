import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync(new URL("../tools/atomic-output-temp.mjs", import.meta.url), "utf8");
const releaseOutput = fs.readFileSync(new URL("../tools/release-output-io.mjs", import.meta.url), "utf8");
const packageOutput = fs.readFileSync(new URL("../tools/package-output-io.mjs", import.meta.url), "utf8");

test("M1134 snapshots and revalidates a real atomic-output parent", () => {
  for (const marker of [
    "snapshotAtomicOutputParent",
    "assertAtomicOutputParentUnchanged",
    "Atomic output parent must be a real directory",
    "Atomic output parent changed before publish",
    "left.dev",
    "left.ino"
  ]) assert.ok(helper.includes(marker), `missing M1134 helper marker ${marker}`);
});

test("M1134 both output writers revalidate parent identity immediately before rename", () => {
  for (const source of [releaseOutput, packageOutput]) {
    assert.match(source, /const parentSnapshot = await snapshotAtomicOutputParent\(parent\)/);
    const check = source.indexOf("await assertAtomicOutputParentUnchanged(parentSnapshot)");
    const publish = source.indexOf("await rename(temp, output)");
    assert.ok(check >= 0 && publish > check, "parent identity check must precede atomic publish");
  }
});
