import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/settings-backup.js", import.meta.url), "utf8");

test("settings backup includes bounded cookie-banner site exclusions", () => {
  assert.match(source, /"cookieBannerDisabledSites"/);
  assert.match(source, /cookieBannerDisabledSites: normalizeDomainsStrict\(source\.cookieBannerDisabledSites, "cookieBannerDisabledSites"\)/);
  assert.match(source, /cookieBannerDisabledSites: normalizeDomainsStrict\(source\.cookieBannerDisabledSites \?\? \[\], "cookieBannerDisabledSites"\)/);
  assert.doesNotMatch(source, /REQUIRED_IMPORT_SETTINGS_KEYS[^\n]*cookieBannerDisabledSites/);
  assert.match(source, /domains: 5_000/);
});
