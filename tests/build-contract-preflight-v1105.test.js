import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const build = fs.readFileSync(new URL("../tools/build.mjs", import.meta.url), "utf8");

test("M1105 direct build runs filesystem and generated-contract audits before output mutation", () => {
  const sourceAudit = build.indexOf("await auditSourceTree(root)");
  const contractAudit = build.indexOf("await auditGeneratedExtensionContract(root)");
  const distReset = build.indexOf("await rm(dist, { recursive: true, force: true })");
  const buildInfo = build.indexOf("await createBuildInfo(root)");
  assert.ok(sourceAudit >= 0);
  assert.ok(contractAudit > sourceAudit);
  assert.ok(distReset > contractAudit);
  assert.ok(buildInfo > distReset);
  assert.match(build, /generated-extension-contract-audit\.mjs/);
});

test("M1105 keeps direct build contract-driven after preflight", () => {
  assert.match(build, /generatedExtensionFilesForBrowser\(browser\)/);
  assert.match(build, /await readRegularFileBounded\(source/);
  assert.match(build, /await writeBuildOutputBinaryAtomic\(root, destinationRelative, data\)/);
});
