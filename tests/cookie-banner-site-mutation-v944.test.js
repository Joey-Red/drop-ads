import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cookie-banner-site-policy.js", import.meta.url), "utf8");

test("cookie-banner site mutation is canonical storage-only policy", () => {
  assert.match(source, /normalizeDomain\(domain\)/);
  assert.match(source, /setDomainFlag\(state\.cookieBannerDisabledSites, normalizedDomain, disabled\)/);
  assert.match(source, /saveState\(api, \{ \.\.\.state, cookieBannerDisabledSites: nextSites \}\)/);
  assert.match(source, /Object\.freeze\(\{ domain: normalizedDomain, disabled, changed \}\)/);
  assert.doesNotMatch(source, /declarativeNetRequest|storage\.session|fetch\(|sendMessage|telemetry|analytics/);
});
