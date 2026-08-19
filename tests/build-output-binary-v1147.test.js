import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const buildOutput = fs.readFileSync(new URL("../tools/build-output-io.mjs", import.meta.url), "utf8");

test("M1147 adds a 16 MiB bounded binary build output writer", () => {
  for (const marker of [
    "BUILD_OUTPUT_BINARY_MAX_BYTES = 16 * 1024 * 1024",
    "export async function writeBuildOutputBinaryAtomic",
    "Build output binary data is required",
    "Build output binary size is invalid"
  ]) assert.ok(buildOutput.includes(marker), `missing M1147 binary marker ${marker}`);
});

test("M1147 binary writes inherit the canonical atomic publication safeguards", () => {
  const binary = buildOutput.slice(buildOutput.indexOf("export async function writeBuildOutputBinaryAtomic"));
  for (const marker of [
    "await requireRealBuildOutputAncestry(rootDirectory, output)",
    "snapshotAtomicOutputParent(parent)",
    "createAtomicOutputTempPath(output)",
    'open(temp, "wx", 0o600)',
    "await handle.sync()",
    "assertAtomicOutputParentUnchanged(parentSnapshot)",
    "await rename(temp, output)",
    "assertAtomicOutputPublished(output, bytes)"
  ]) assert.ok(binary.includes(marker), `missing M1147 binary safeguard ${marker}`);
});
