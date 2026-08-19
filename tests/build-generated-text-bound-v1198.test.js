import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1198 uses the shared generated text ceiling before atomic writes", () => {
  assert.match(build, /BUILD_OUTPUT_TEXT_MAX_BYTES/);
  assert.match(build, /function assertGeneratedTextWithinBuildLimit\(text, label\)/);
  assert.match(build, /Buffer\.byteLength\(text, "utf8"\)/);
  assert.match(build, /bytes > BUILD_OUTPUT_TEXT_MAX_BYTES/);
  assert.match(build, /assertGeneratedTextWithinBuildLimit\(serializedBuildInfo, "generated build-info\.json"\)/);
});

test("M1198 computes and bounds each manifest serialization once", () => {
  assert.match(build, /const manifestText = `\$\{JSON\.stringify\(manifest, null, 2\)\}\\n`/);
  const bound = build.indexOf("assertGeneratedTextWithinBuildLimit(manifestText");
  const write = build.indexOf("writeBuildOutputTextAtomic(root, `dist/${browser}/manifest.json`, manifestText)");
  assert.ok(bound >= 0 && write > bound);
});
