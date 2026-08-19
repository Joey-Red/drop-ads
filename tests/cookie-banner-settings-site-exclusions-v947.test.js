import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/cookie-banner-settings.js", import.meta.url), "utf8");

test("Settings manages only configured cookie-banner site exclusions", () => {
  assert.match(source, /siteInput\.maxLength = MAX_CANONICAL_DOMAIN_CHARS/);
  assert.match(source, /normalizeDomain\(siteInput\.value\.trim\(\)\)/);
  assert.match(source, /renderSiteList\(state\.cookieBannerDisabledSites\)/);
  assert.match(source, /setCookieBannerSiteDisabled\(api, domain, true\)/);
  assert.match(source, /setCookieBannerSiteDisabled\(api, domain, false\)/);
  assert.match(source, /Network, cookie, and cosmetic blocking stay configured normally/);
  assert.doesNotMatch(source, /location\.href|document\.title|fetch\(|sendBeacon|telemetry|analytics/);
});
