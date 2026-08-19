import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const composition = read("src/content/cookie-banner-utils-composition.js");
const actionSource = read("src/content/cookie-banner-action-source-safety.js");
const consent = read("src/content/cookie-banner-consent-safety.js");
const executor = read("src/content/cookie-banner-executor.js");
const controller = read("src/content/cookie-banner-controller.js");
const shadows = read("src/content/cookie-banner-shadow-roots.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [composition, 'const COMPOSITION_GLOBAL = "DropAdsCookieBannerUtilsComposition";', "composition global"],
  [composition, 'function snapshotUtils()', "descriptor-safe utility snapshot"],
  [composition, 'function replaceUtils(overrides)', "descriptor-safe utility replacement"],
  [actionSource, 'ownDataValue(composition, "snapshotUtils")', "action-source utility snapshot capture"],
  [actionSource, 'ownDataValue(composition, "replaceUtils")', "action-source replacement capture"],
  [actionSource, 'Reflect.apply(replaceUtils, composition, [{ textSnapshot }])', "action-source composed replacement"],
  [consent, 'ownDataValue(utils, "boundedConsentContext")', "consent bounded-context capture"],
  [consent, 'Object.defineProperty(globalThis, CONSENT_SAFETY_GLOBAL', "immutable consent-safety publication"],
  [executor, 'ownDataValue(utils, "snapshotCandidate")', "executor candidate snapshot capture"],
  [executor, 'ownDataValue(globalThis, "DropAdsCookieBannerConsentSafety")', "executor consent global capture"],
  [executor, 'Object.defineProperty(globalThis, EXECUTOR_GLOBAL', "immutable executor publication"],
  [controller, 'function exactFrozenApi(globalName, expectedKeys)', "controller exact frozen API validator"],
  [controller, 'exactFrozenApi("DropAdsCookieBannerExecutor"', "controller executor API validation"],
  [controller, 'exactFrozenApi("DropAdsCookieBannerShadowRoots"', "controller shadow API validation"],
  [controller, 'exactFrozenApi("DropAdsCookieBannerConsentSafety"', "controller consent API validation"],
  [controller, 'Reflect.apply(activateRejectionCandidate, undefined, [candidate])', "captured activation invocation"],
  [shadows, 'captureData(document, "createTreeWalker")', "captured createTreeWalker"],
  [shadows, 'captureData(TreeWalkerPrototype, "nextNode")', "captured TreeWalker nextNode"],
  [shadows, 'captureGetter(ElementPrototype, "shadowRoot")', "captured shadowRoot getter"],
  [shadows, 'Object.defineProperty(globalThis, SHADOW_ROOTS_GLOBAL', "immutable shadow helper publication"]
]) requireText(source, needle, label);

for (const [source, label] of [
  [actionSource, "action-source"], [consent, "consent-safety"], [executor, "executor"], [controller, "controller"], [shadows, "shadow helper"]
]) requireAbsent(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, `${label} persistence/network/profile surface`);

for (const [source, label] of [[actionSource, "action-source"], [executor, "executor"], [controller, "controller"]]) {
  requireAbsent(source, /const utils = globalThis\.DropAdsCookieBannerUtils/, `${label} direct live utility capture`);
}
requireAbsent(actionSource, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=|Object\.assign/i, "action-source spread/global replacement");

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry) throw new Error("cookie-banner manifest entry is missing");
if (JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner content entry differs between Chromium and Firefox");
if (chromiumEntry.all_frames !== false) throw new Error("cookie-banner content runtime must remain top-frame-only");
const expectedOrder = [
  "content/cookie-banner-utils.js", "content/cookie-banner-utils-composition.js", "content/cookie-banner-locale-extension.js",
  "content/cookie-banner-action-source-safety.js", "content/cookie-banner-action-context-safety.js", "content/cookie-banner-action-semantics-safety.js",
  "content/cookie-banner-shadow-roots.js", "content/cookie-banner-consent-safety.js", "content/cookie-banner-executor.js", "content/cookie-banner-controller.js"
];
if (JSON.stringify(chromiumEntry.js) !== JSON.stringify(expectedOrder)) throw new Error("cookie-banner collaborator script order is not canonical");

if (packageJson.scripts?.["cookie-banner-collaborator-ownership-audit"] !== "node tools/cookie-banner-collaborator-ownership-audit.mjs") throw new Error("cookie-banner-collaborator-ownership-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-collaborator-ownership-audit")) throw new Error("cookie-banner collaborator ownership audit is not wired into npm run check");

// Collaborator ownership is verified directly from current runtime source and
// manifests. Historical test source is intentionally not used as implementation evidence.

console.log("cookie-banner-collaborator-ownership-audit: canonical M1032-M1037 collaborator ownership invariants verified");
