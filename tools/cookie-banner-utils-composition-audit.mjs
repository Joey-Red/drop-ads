import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const helper = read("src/content/cookie-banner-utils-composition.js");
const locale = read("src/content/cookie-banner-locale-extension.js");
const context = read("src/content/cookie-banner-action-context-safety.js");
const semantics = read("src/content/cookie-banner-action-semantics-safety.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['const EXPECTED_UTIL_KEYS = Object.freeze([', "exact utility-key schema"],
  ['const MAX_OVERRIDE_KEYS = 4;', "override-key ceiling"],
  ['Object.getOwnPropertyDescriptor(globalThis, UTILS_GLOBAL)', "global utility data descriptor"],
  ['Reflect.ownKeys(utils)', "utility own-key snapshot"],
  ['Object.isFrozen(utils)', "frozen utility requirement"],
  ['prototype !== Object.prototype', "plain utility prototype requirement"],
  ['descriptor.writable || descriptor.configurable', "frozen utility data-property requirement"],
  ['function snapshotOverrides(overrides)', "override descriptor snapshot"],
  ['!EXPECTED_UTIL_KEY_SET.has(key)', "unknown override refusal"],
  ['function replaceUtils(overrides)', "safe utility replacement"],
  ['Object.defineProperty(next, key', "explicit utility reconstruction"],
  ['Object.defineProperty(globalThis, COMPOSITION_GLOBAL', "immutable helper publication"]
]) requireText(helper, needle, label);
requireAbsent(helper, /\.\.\.utils|Object\.assign|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "utility-composition spread/persistence/network/profile surface");

for (const [needle, label] of [
  ['globalThis.DropAdsCookieBannerUtilsComposition', "localized scoring composition helper"],
  ['composition.snapshotUtils()', "localized scoring descriptor snapshot"],
  ['composition.replaceUtils({ rejectionScore })', "localized scoring safe replacement"]
]) requireText(locale, needle, label);
requireAbsent(locale, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=|Object\.assign/i, "localized scoring legacy utility replacement");

for (const [source, name] of [[context, "action-context"], [semantics, "action-semantics"]]) {
  for (const [needle, label] of [
    ['ownDataValue(globalThis, "DropAdsCookieBannerUtilsComposition")', `${name} composition helper descriptor`],
    ['ownDataValue(composition, "snapshotUtils")', `${name} snapshot capture`],
    ['ownDataValue(composition, "replaceUtils")', `${name} replacement capture`],
    ['Reflect.apply(snapshotUtils, composition, [])', `${name} descriptor snapshot invocation`],
    ['Reflect.apply(replaceUtils, composition, [{ textSnapshot }])', `${name} safe replacement invocation`]
  ]) requireText(source, needle, label);
  requireAbsent(source, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=|Object\.assign/i, `${name} legacy utility replacement`);
}

for (const [needle, label] of [
  ['function baseRejectionScore(value)', "base-score result contract"],
  ['!Number.isSafeInteger(score) || score < 0 || score > 100', "base-score range validation"],
  ['const MAX_NORMALIZED_ACTION_CHARS = 160;', "normalized-action ceiling"],
  ['const CANONICAL_ACTION_TEXT_PATTERN = /^[a-z0-9\' -]+$/;', "normalized-action grammar"],
  ['function normalizedActionText(value)', "normalized-action result contract"],
  ['function frozenDataDescriptor(object, key, enumerable)', "localized data descriptor validation"],
  ['function snapshotLocalizedTuple(entry)', "localized tuple snapshot"],
  ['function buildLocalizedLexicon(entries)', "localized lexicon build"],
  ['const lookup = Object.create(null);', "null-prototype localized lookup"],
  ['const LOCALIZED_SCORE_BY_PHRASE = buildLocalizedLexicon(LOCALIZED_REJECTION_PHRASES);', "compiled localized lookup"]
]) requireText(locale, needle, label);
requireAbsent(locale, /navigator\.language|navigator\.languages|Intl\.|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i, "localized scoring persistence/network/profile surface");

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry) throw new Error("cookie-banner manifest entry is missing");
if (JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner content entry differs between Chromium and Firefox");
const utilsIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils.js");
const helperIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils-composition.js");
const localeIndex = chromiumEntry.js.indexOf("content/cookie-banner-locale-extension.js");
const sourceIndex = chromiumEntry.js.indexOf("content/cookie-banner-action-source-safety.js");
const contextIndex = chromiumEntry.js.indexOf("content/cookie-banner-action-context-safety.js");
const semanticsIndex = chromiumEntry.js.indexOf("content/cookie-banner-action-semantics-safety.js");
if (!(utilsIndex >= 0
  && helperIndex === utilsIndex + 1
  && localeIndex === helperIndex + 1
  && sourceIndex === localeIndex + 1
  && contextIndex === sourceIndex + 1
  && semanticsIndex === contextIndex + 1)) throw new Error("cookie-banner utility-composition script order is not canonical");

if (packageJson.scripts?.["cookie-banner-utils-composition-audit"] !== "node tools/cookie-banner-utils-composition-audit.mjs") throw new Error("cookie-banner-utils-composition-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-utils-composition-audit")) throw new Error("cookie-banner-utils-composition-audit is not wired into npm run check");

// Live composition, localization, privacy, and manifest invariants are checked above.
// Historical milestone test-file presence is intentionally not part of this audit.

console.log("cookie-banner-utils-composition-audit: canonical M1022-M1028 utility composition invariants verified");
