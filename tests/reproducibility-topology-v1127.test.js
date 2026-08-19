import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/verify-reproducible.mjs", import.meta.url), "utf8");

test("M1127 locks reproducibility dist top-level membership to exact release identity", () => {
  for (const marker of [
    'readBoundedJsonFile(resolve(root, "package.json")',
    'snapshotReleasePackageIdentity(packageJson?.name, packageJson?.version, "package.json")',
    '{ name: "chromium", type: "directory" }',
    '{ name: "firefox", type: "directory" }',
    '${identity.name}-${identity.version}-chromium.zip',
    '${identity.name}-${identity.version}-firefox.xpi',
    '{ name: "release-manifest.json", type: "file" }',
    'Reproducibility dist top-level set is invalid'
  ]) assert.ok(source.includes(marker), `missing M1127 marker ${marker}`);
});

test("M1127 validates top-level type and identity before recursive hashing", () => {
  assert.match(source, /Reproducibility dist top-level rejects symbolic link/);
  assert.match(source, /Reproducibility dist top-level requires directory/);
  assert.match(source, /Reproducibility dist top-level requires regular file/);
  const snapshot = source.indexOf("export async function snapshotDist");
  const validate = source.indexOf("await validateDistTopLevel(root, dist)", snapshot);
  const walk = source.indexOf("await walk(dist)", snapshot);
  assert.ok(snapshot >= 0 && validate > snapshot && walk > validate);
});
