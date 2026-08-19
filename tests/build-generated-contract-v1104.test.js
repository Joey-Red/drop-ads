import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1104 build copies only generated-contract source/list members", () => {
  assert.match(build, /generatedExtensionFilesForBrowser/);
  assert.match(build, /for \(const relativePath of generatedExtensionFilesForBrowser\(browser\)\)/);
  assert.match(build, /relativePath\.startsWith\("lists\/"\)/);
  assert.match(build, /await readRegularFileBounded\(source/);
  assert.match(build, /await writeBuildOutputBinaryAtomic\(root, destinationRelative, data\)/);
  assert.doesNotMatch(build, /\bcopyFile\s*\(/);
  assert.doesNotMatch(build, /\bcp\(/);
  assert.doesNotMatch(build, /rm\(resolve\(out, "rules"\)/);
});

test("M1104 keeps generated files explicit rather than treating them as copied source", () => {
  assert.match(build, /GENERATED_FILES = new Set\(\["manifest\.json", "build-info\.json"\]\)/);
  assert.match(build, /writeBuildOutputTextAtomic\(root, `dist\/\$\{browser\}\/manifest\.json`/);
  assert.match(build, /writeBuildOutputTextAtomic\(root, `dist\/\$\{browser\}\/build-info\.json`/);
});
