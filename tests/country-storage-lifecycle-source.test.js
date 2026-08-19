import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("Country Settings owns and disposes storage live-sync", () => {
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /let disposeStorageLiveSync = null/);
  assert.match(source, /disposeStorageLiveSync = installOwnedOptionsStorageListener\(api,/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /disposeStorageLiveSync\?\.\(\)/);
  assert.match(source, /disposeStorageLiveSync = null/);
  assert.doesNotMatch(source, /installOptionsStorageListener\(api,/);
});
