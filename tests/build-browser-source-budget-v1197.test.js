import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1197 caps generated source consumption per browser", () => {
  assert.match(build, /MAX_BUILD_BROWSER_SOURCE_BYTES = 64 \* 1024 \* 1024/);
  assert.match(build, /function addBrowserSourceBytes\(budget, bytes, browser\)/);
  assert.match(build, /build source bytes exceed the/);
  assert.match(build, /const sourceBudget = \{ bytes: 0 \}/);
});

test("M1197 charges copied members and raw manifest bytes before publication", () => {
  const copyCharge = build.indexOf("addBrowserSourceBytes(sourceBudget, data.byteLength, browser)");
  const copyWrite = build.indexOf("writeBuildOutputBinaryAtomic(root, destinationRelative, data)");
  assert.ok(copyCharge >= 0 && copyWrite > copyCharge);
  assert.match(build, /return Object\.freeze\(\{ manifest, sourceBytes: data\.byteLength \}\)/);
  const manifestCharge = build.indexOf("addBrowserSourceBytes(sourceBudget, sourceBytes, browser)");
  const manifestWrite = build.indexOf("writeBuildOutputTextAtomic(root, `dist/${browser}/manifest.json`");
  assert.ok(manifestCharge >= 0 && manifestWrite > manifestCharge);
});
