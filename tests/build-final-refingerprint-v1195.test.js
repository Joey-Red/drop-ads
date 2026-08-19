import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1195 recreates canonical build-info after generated output creation", () => {
  assert.match(build, /const finalBuildInfo = await createBuildInfo\(root\)/);
  assert.match(build, /const finalSerializedBuildInfo = serializeBuildInfo\(finalBuildInfo\)/);
  assert.match(build, /finalSerializedBuildInfo !== serializedBuildInfo/);
  assert.match(build, /Build source state changed during generated output creation/);
});

test("M1195 final source verification happens before success reporting", () => {
  const finalCheck = build.indexOf("const finalBuildInfo = await createBuildInfo(root)");
  const success = build.indexOf("console.log(`Built contract-locked unpacked extensions");
  assert.ok(finalCheck >= 0 && success > finalCheck);
});
