import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const helper = read("src/content/cookie-banner-utils-composition.js");
const locale = read("src/content/cookie-banner-locale-extension.js");
const consent = read("src/content/cookie-banner-consent-safety.js");
const fixture = read("tools/cookie-banner-localization-qualification-server.mjs");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['const MAX_LOCALIZED_REJECTION_PHRASES = 32;', "localized phrase-count ceiling"],
  ['const MAX_LOCALIZED_PHRASE_CHARS = 96;', "localized phrase-length ceiling"],
  ['const MAX_NORMALIZED_ACTION_CHARS = 160;', "localized normalized-action ceiling"],
  ['function buildLocalizedLexicon(entries)', "localized lexicon builder"],
  ['function snapshotLocalizedTuple(entry)', "localized tuple snapshot"],
  ['function frozenDataDescriptor(object, key, enumerable)', "localized data-descriptor validator"],
  ['!Object.isFrozen(entries)', "frozen localized lexicon requirement"],
  ['!Object.isFrozen(entry)', "frozen localized tuple requirement"],
  ['lengthDescriptor.value !== 2', "two-field localized tuple requirement"],
  ['score !== 100 && score !== 86', "reviewed localized score classes"],
  ['Object.prototype.hasOwnProperty.call(lookup, tuple.phrase)', "localized duplicate refusal"],
  ['normalized !== phrase', "canonical localized normalization check"],
  ['function baseRejectionScore(value)', "base score result contract"],
  ['!Number.isSafeInteger(score) || score < 0 || score > 100', "base score range"],
  ['if (baseScore > 0) return baseScore;', "base scoring precedence"],
  ['if (!LOCALIZED_SCORE_BY_PHRASE) return 0;', "localized fail-closed gate"],
  ['composition.snapshotUtils()', "descriptor-safe localization snapshot"],
  ['composition.replaceUtils({ rejectionScore })', "descriptor-safe localization replacement"]
]) requireText(locale, needle, label);

for (const phrase of [
  "odrzuc wszystkie", "odrzuc wszystko", "odrzuc wszystkie pliki cookie", "tylko niezbedne", "tylko niezbedne pliki cookie",
  "avvisa alla", "avvisa alla kakor", "endast nodvandiga", "endast nodvandiga kakor",
  "afvis alle", "afvis alle cookies", "kun nodvendige", "kun nodvendige cookies",
  "avvis alle", "avvis alle informasjonskapsler", "bare nodvendige", "bare nodvendige informasjonskapsler",
  "hylkaa kaikki", "hylkaa kaikki evasteet", "vain valttamattomat", "vain valttamattomat evasteet",
  "odmitnout vse", "odmitnout vsechny", "pouze nezbytne", "pouze nezbytne soubory cookie"
]) requireText(locale, `\"${phrase}\"`, `localized phrase ${phrase}`);

for (const [needle, label] of [
  ["pliki cookie", "Polish strong consent evidence"], ["ustawienia prywatności", "Polish privacy-choice evidence"],
  ["kakor", "Swedish strong consent evidence"], ["integritetsval", "Swedish privacy-choice evidence"],
  ["privatlivsvalg", "Danish privacy-choice evidence"], ["informasjonskapsler", "Norwegian strong consent evidence"],
  ["personvernvalg", "Norwegian privacy-choice evidence"], ["evästeet", "Finnish strong consent evidence"],
  ["tietosuojavalinnat", "Finnish privacy-choice evidence"], ["soubory cookie", "Czech strong consent evidence"],
  ["volby soukromí", "Czech privacy-choice evidence"]
]) requireText(consent, needle, label);

for (const language of ["polish", "swedish", "danish", "norwegian", "finnish", "czech"]) {
  for (const suffix of ["generic-consent", "exactness", "necessary", "priority", "ambiguity"]) {
    requireText(fixture, `/${language}-${suffix}`, `${language} ${suffix} qualification route`);
  }
}

requireText(helper, 'const EXPECTED_UTIL_KEYS = Object.freeze([', "cookie-banner utility composition schema");
requireText(fixture, 'const HOST = "127.0.0.1";', "localization fixture loopback binding");
requireText(fixture, 'const MAX_REQUEST_URL_CHARS = 2048;', "localization fixture request bound");
requireText(fixture, 'const MAX_CONNECTIONS = 16;', "localization fixture connection bound");
requireAbsent(locale, /navigator\.language|navigator\.languages|Intl\.|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i, "localization runtime profile/persistence/network surface");
requireAbsent(fixture, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|localStorage|sessionStorage|indexedDB/i, "localization fixture persistence/network surface");

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry) throw new Error("cookie-banner manifest entry is missing");
if (JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner content entry differs between Chromium and Firefox");
const utilsIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils.js");
const helperIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils-composition.js");
const localeIndex = chromiumEntry.js.indexOf("content/cookie-banner-locale-extension.js");
const actionSafetyIndex = chromiumEntry.js.indexOf("content/cookie-banner-action-source-safety.js");
if (!(utilsIndex >= 0 && helperIndex === utilsIndex + 1 && localeIndex === helperIndex + 1 && actionSafetyIndex === localeIndex + 1)) throw new Error("localization content-script order is not canonical");

if (packageJson.scripts?.["cookie-banner-localization-audit"] !== "node tools/cookie-banner-localization-audit.mjs") throw new Error("cookie-banner-localization-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-localization-audit")) throw new Error("cookie-banner-localization-audit is not wired into npm run check");

// Current localization runtime, fixture, privacy, and manifest invariants are checked
// directly above. Historical milestone test filenames are intentionally not required.

console.log("cookie-banner-localization-audit: canonical M1002-M1017 localization invariants verified; extended through M1028");
