import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const packageSource = fs.readFileSync(new URL("../tools/package.mjs", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../tools/release-tool-contract.mjs", import.meta.url), "utf8");

test("M1115 direct packaging audits provenance before package/build/archive work", () => {
  assert.match(packageSource, /import \{ auditReleaseToolContract \} from "\.\/release-tool-contract-audit\.mjs"/);
  const audit = packageSource.indexOf("await auditReleaseToolContract(root)");
  const packageRead = packageSource.indexOf("readBoundedJsonFile(resolve(root, \"package.json\")");
  const archive = packageSource.indexOf("await makeStoredZip");
  assert.ok(audit >= 0 && audit < packageRead && packageRead < archive);
  assert.match(packageSource, /-chromium\.zip/);
  assert.match(packageSource, /-firefox\.xpi/);
});

test("M1115 provenance covers direct package contract dependencies", () => {
  for (const path of [
    "tools/bounded-json-file.mjs",
    "tools/build-info.mjs",
    "tools/release-tool-contract.mjs",
    "tools/release-tool-contract-audit.mjs"
  ]) assert.ok(contract.includes(`\"${path}\"`), `missing ${path}`);
});
