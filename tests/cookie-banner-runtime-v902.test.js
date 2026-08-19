import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const runtimeSource = fs.readFileSync(new URL("../src/core/cookie-banner-runtime.js", import.meta.url), "utf8");
const backgroundSource = fs.readFileSync(new URL("../src/background.js", import.meta.url), "utf8");

test("cookie-banner policy runtime accepts only canonical domain requests and returns one boolean", () => {
  assert.match(runtimeSource, /REQUEST_KEYS = new Set\(\["type", "domain"\]\)/);
  assert.match(runtimeSource, /assertPlainExactObject\(message, "Cookie-banner policy request", REQUEST_KEYS\)/);
  assert.match(runtimeSource, /normalizedDomain !== domain\.value/);
  assert.match(runtimeSource, /Object\.freeze\(\{\s*enabled:/s);
  assert.match(runtimeSource, /DISABLED_POLICY = Object\.freeze\(\{ enabled: false \}\)/);
  assert.doesNotMatch(runtimeSource, /hostname:|url:|tabId:|page:|history:|count:|timestamp:/);
});

test("cookie-banner policy honors configured and site recovery state and is optional at bootstrap", () => {
  assert.match(runtimeSource, /state\.enabled === true/);
  assert.match(runtimeSource, /state\.cookieBannerMode === "reject"/);
  assert.match(runtimeSource, /!domainCoveredBy\(state\.disabledSites, request\.domain\)/);
  assert.match(runtimeSource, /!domainCoveredBy\(session\.disabledSites, request\.domain\)/);
  assert.match(backgroundSource, /installCookieBannerRuntime/);
  assert.match(backgroundSource, /name: "cookie-banner-runtime"/);
});
