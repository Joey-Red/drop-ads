import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const buildOutput = fs.readFileSync(new URL("../tools/build-output-io.mjs", import.meta.url), "utf8");
const atomic = fs.readFileSync(new URL("../tools/atomic-output-temp.mjs", import.meta.url), "utf8");

test("M1143 snapshots and revalidates the build output parent before rename", () => {
  assert.match(buildOutput, /const parentSnapshot = await snapshotAtomicOutputParent\(parent\);/);
  const revalidate = buildOutput.indexOf("await assertAtomicOutputParentUnchanged(parentSnapshot)");
  const rename = buildOutput.indexOf("await rename(temp, output)");
  assert.ok(revalidate >= 0 && rename > revalidate, "parent revalidation must precede build output rename");
});

test("M1143 shared parent guard rejects replacement and symlink state", () => {
  for (const marker of [
    "Atomic output parent must be a real directory",
    "Atomic output parent changed before publish",
    "current.isSymbolicLink()",
    "sameFilesystemIdentity"
  ]) assert.ok(atomic.includes(marker), `missing M1143 shared guard marker ${marker}`);
});
