import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1196 derives generated source membership from both browser contracts", () => {
  assert.match(build, /function contractSourceFingerprintPath\(relativePath\)/);
  assert.match(build, /function assertGeneratedSourceMembership\(descriptorMap\)/);
  assert.match(build, /new Set\(browsers\.map\(\(browser\) => `manifests\/\$\{browser\}\.json`\)\)/);
  assert.match(build, /generatedExtensionFilesForBrowser\(browser\)/);
  assert.match(build, /Generated source is missing from build-info inputs/);
});

test("M1196 completes membership preflight before generated directory publication", () => {
  const membership = build.indexOf("assertGeneratedSourceMembership(buildInputDescriptors)");
  const publish = build.indexOf("await ensureBuildDirectory(`dist/${browser}`)");
  assert.ok(membership >= 0 && publish > membership);
});
