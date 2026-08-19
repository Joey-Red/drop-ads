import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cookie-banner-runtime.js", import.meta.url), "utf8");

test("cookie-banner policy honors dedicated persistent site exclusions", () => {
  assert.match(source, /!domainCoveredBy\(state\.cookieBannerDisabledSites, request\.domain\)/);
  assert.match(source, /!domainCoveredBy\(state\.disabledSites, request\.domain\)/);
  assert.match(source, /!domainCoveredBy\(session\.disabledSites, request\.domain\)/);
  assert.match(source, /domain === candidate \|\| domain\.endsWith\(`\.\$\{candidate\}`\)/);
  assert.doesNotMatch(source, /cookieBannerDisabledSites:/);
});
