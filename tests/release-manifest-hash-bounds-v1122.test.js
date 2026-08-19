import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/release-manifest.mjs", import.meta.url), "utf8");

test("M1122 release-manifest hashing is bounded before work", () => {
  for (const marker of [
    "RELEASE_TOOL_MAX_BYTES = 2 * 1024 * 1024",
    "RELEASE_ARTIFACT_MAX_BYTES = 64 * 1024 * 1024",
    "byte size exceeds its hashing limit",
    "describeReleaseFile(toolPath.absolute, `packaging tool ${path}`, RELEASE_TOOL_MAX_BYTES)",
    "describeReleaseFile(artifactPath.absolute, `${artifact.browser} release artifact`, RELEASE_ARTIFACT_MAX_BYTES)"
  ]) assert.ok(source.includes(marker), `missing M1122 marker ${marker}`);
});

test("M1122 validated manifest descriptors cannot claim over-limit files", () => {
  assert.match(source, /fields\.bytes > RELEASE_TOOL_MAX_BYTES/);
  assert.match(source, /fields\.bytes > RELEASE_ARTIFACT_MAX_BYTES/);
  assert.match(source, /before\.size <= 0 \|\| before\.size > maxBytes/);
  assert.match(source, /opened\.size <= 0 \|\| opened\.size > maxBytes/);
});
