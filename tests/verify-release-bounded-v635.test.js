import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/verify-release.mjs", import.meta.url), "utf8");

test("release verification routes metadata through bounded validated readers", () => {
  for (const needle of [
    "readBoundedJsonFile(resolve(root, \"package.json\")",
    "readBoundedJsonFile(resolve(root, \"dist\", browser, \"build-info.json\")",
    "validateBuildInfo(actualJson)",
    "readBoundedJsonFile(resolve(root, \"dist\", \"release-manifest.json\")",
    "validateReleaseManifest(recordedManifestJson)"
  ]) assert.ok(source.includes(needle), `missing release verification boundary: ${needle}`);
});

test("release verification no longer directly readFile/JSON.parse metadata", () => {
  assert.doesNotMatch(source, /\breadFile\s*\(/);
  assert.doesNotMatch(source, /JSON\.parse\s*\(/);
});
