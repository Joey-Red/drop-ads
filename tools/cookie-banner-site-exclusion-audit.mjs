import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const storage = read("src/core/storage.js");
const limits = read("src/core/state-limits.js");
const runtime = read("src/core/cookie-banner-runtime.js");
const mutation = read("src/core/cookie-banner-site-policy.js");
const popup = read("src/popup/popup.js");
const popupBoundary = read("src/core/popup-boundary.js");
const popupHtml = read("src/popup/index.html");
const shortcuts = read("src/popup/shortcut-catalog.js");
const settings = read("src/options/cookie-banner-settings.js");
const backup = read("src/core/settings-backup.js");
const pkg = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ["cookieBannerDisabledSites: EMPTY_STATE_COLLECTION", "default site exclusions"],
  ["cookieBannerDisabledSites: Object.freeze([])", "cloned site exclusions"],
  ["cookieBannerDisabledSites: Object.freeze(normalizeDomainSet(source.cookieBannerDisabledSites))", "normalized site exclusions"]
]) requireText(storage, needle, label);
requireText(limits, '["cookieBannerDisabledSites", LIVE_STATE_LIMITS.domains]', "configured domain bound");
requireText(runtime, "!domainCoveredBy(state.cookieBannerDisabledSites, request.domain)", "runtime site-exclusion gate");

for (const [needle, label] of [
  ["setDomainFlag(state.cookieBannerDisabledSites, normalizedDomain, disabled)", "canonical site mutation"],
  ["saveState(api, { ...state, cookieBannerDisabledSites: nextSites })", "storage-only persistence"],
  ["Object.freeze({ domain: normalizedDomain, disabled, changed })", "minimal immutable mutation result"]
]) requireText(mutation, needle, label);
requireAbsent(mutation, /declarativeNetRequest|storage\.session|fetch\(|sendMessage|telemetry|analytics/, "mutation side effect surface");

for (const [needle, label] of [
  ["state.cookieBannerDisabledSites.includes(currentSite)", "popup site state"],
  ["setCookieBannerSiteDisabled(api, currentSite, !desiredEnabled)", "popup mutation"],
  ["normal blocking stays on", "popup recovery guidance"]
]) requireText(popup, needle, label);
requireText(popupBoundary, "cookieBannerDisabledSites: Object.freeze(cookieBannerDisabledSites)", "bounded popup state");
requireText(popupHtml, 'id="cookie-banner-site-enabled"', "popup site control");
requireText(shortcuts, 'key: "b", shortcut: "B", controlId: "cookie-banner-site-enabled"', "popup B shortcut");

for (const [needle, label] of [
  ["siteInput.maxLength = MAX_CANONICAL_DOMAIN_CHARS", "Settings input bound"],
  ["renderSiteList(state.cookieBannerDisabledSites)", "Settings configured-domain render"],
  ["setCookieBannerSiteDisabled(api, domain, true)", "Settings add mutation"],
  ["setCookieBannerSiteDisabled(api, domain, false)", "Settings remove mutation"]
]) requireText(settings, needle, label);
requireAbsent(settings, /location\.href|document\.title|fetch\(|sendBeacon|telemetry|analytics/, "Settings privacy escape surface");

for (const [needle, label] of [
  ["cookieBannerDisabledSites: normalizeDomainsStrict(source.cookieBannerDisabledSites, \"cookieBannerDisabledSites\")", "backup export"],
  ["cookieBannerDisabledSites: normalizeDomainsStrict(source.cookieBannerDisabledSites ?? [], \"cookieBannerDisabledSites\")", "legacy-compatible backup import"],
  ["domains: 5_000", "backup domain bound"]
]) requireText(backup, needle, label);

if (pkg.scripts?.["cookie-banner-site-exclusion-audit"] !== "node tools/cookie-banner-site-exclusion-audit.mjs") throw new Error("cookie-banner-site-exclusion-audit package script is missing");
if (!pkg.scripts?.check?.includes("npm run cookie-banner-site-exclusion-audit")) throw new Error("cookie-banner-site-exclusion-audit is not wired into npm run check");

// Current site-exclusion state/runtime/UI/backup behavior is validated directly above.
// Historical milestone test filenames are intentionally not required by this audit.

console.log("cookie-banner-site-exclusion-audit: canonical M942-M948 site-exclusion invariants verified");
