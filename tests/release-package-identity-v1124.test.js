import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const identity = fs.readFileSync(new URL("../tools/release-package-identity.mjs", import.meta.url), "utf8");
const manifest = fs.readFileSync(new URL("../tools/release-manifest.mjs", import.meta.url), "utf8");
const pkg = fs.readFileSync(new URL("../tools/package.mjs", import.meta.url), "utf8");
const verify = fs.readFileSync(new URL("../tools/verify-release.mjs", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../tools/release-tool-contract.mjs", import.meta.url), "utf8");

test("M1124 has one canonical release package identity grammar", () => {
  assert.match(identity, /RELEASE_PACKAGE_NAME_MAX_LENGTH = 128/);
  assert.match(identity, /RELEASE_PACKAGE_VERSION_MAX_LENGTH = 64/);
  assert.match(identity, /\^\[A-Za-z0-9\._@\+\-\]\+\$/);
  assert.match(identity, /snapshotReleasePackageIdentity/);
});

test("M1124 package, verify-release, and manifest share the canonical identity validator", () => {
  for (const source of [pkg, verify, manifest]) {
    assert.match(source, /snapshotReleasePackageIdentity/);
  }
  assert.doesNotMatch(pkg, /const SAFE_TEXT/);
  assert.doesNotMatch(verify, /const SAFE_TEXT/);
  assert.match(contract, /tools\/release-package-identity\.mjs/);
});
