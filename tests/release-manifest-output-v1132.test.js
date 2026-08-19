import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifestIo = fs.readFileSync(new URL("../tools/release-manifest-io.mjs", import.meta.url), "utf8");
const releaseOutput = fs.readFileSync(new URL("../tools/release-output-io.mjs", import.meta.url), "utf8");

test("M1132 routes release-manifest persistence through the canonical atomic text writer", () => {
  assert.match(manifestIo, /import \{ writeReleaseOutputTextAtomic \} from "\.\/release-output-io\.mjs";/);
  assert.match(manifestIo, /writeReleaseOutputTextAtomic\(dirname\(outputPath\), basename\(outputPath\), serialized\)/);
  assert.match(manifestIo, /RELEASE_MANIFEST_MAX_BYTES/);
  assert.doesNotMatch(manifestIo, /randomBytes|writeFile\(|rename\(|\.pending-/);
});

test("M1132 canonical writer retains fsync, exclusive temp creation, rename, and cleanup", () => {
  for (const marker of [
    "open(temp, \"wx\", 0o600)",
    "await handle.sync()",
    "await rename(temp, output)",
    "await rm(temp, { force: true })"
  ]) assert.ok(releaseOutput.includes(marker), `missing canonical output marker ${marker}`);
});
