import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/package.mjs", import.meta.url), "utf8");

test("M1136 invalidates only the exact candidate release outputs before packaging", () => {
  for (const marker of [
    "const releaseOutputPaths = Object.freeze([",
    "resolve(root, chromiumArtifact)",
    "resolve(root, firefoxArtifact)",
    "resolve(root, \"dist\", \"release-manifest.json\")",
    "async function invalidateReleaseOutputs()",
    "await rm(path, { force: true })",
    "await invalidateReleaseOutputs();"
  ]) assert.ok(source.includes(marker), `missing M1136 marker ${marker}`);
});

test("M1136 cleans release outputs again on package or verification failure", () => {
  const catchIndex = source.indexOf("} catch (error) {");
  const cleanupIndex = source.indexOf("await invalidateReleaseOutputs();", catchIndex);
  const aggregateIndex = source.indexOf("Packaging failed and release outputs could not be invalidated", catchIndex);
  assert.ok(catchIndex >= 0 && cleanupIndex > catchIndex && aggregateIndex > cleanupIndex);
  assert.doesNotMatch(source, /rm\(resolve\(root, "dist", "chromium"\)|rm\(resolve\(root, "dist", "firefox"\)/);
});
