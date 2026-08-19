import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const storage = read("src/core/storage.js");
const settings = read("src/options/cookie-banner-settings.js");
const policyRuntime = read("src/core/cookie-banner-runtime.js");
const controller = read("src/content/cookie-banner-controller.js");
const utils = read("src/content/cookie-banner-utils.js");
const composition = read("src/content/cookie-banner-utils-composition.js");
const localeExtension = read("src/content/cookie-banner-locale-extension.js");
const actionSafety = read("src/content/cookie-banner-action-source-safety.js");
const actionContext = read("src/content/cookie-banner-action-context-safety.js");
const actionSemantics = read("src/content/cookie-banner-action-semantics-safety.js");
const shadowRoots = read("src/content/cookie-banner-shadow-roots.js");
const consentSafety = read("src/content/cookie-banner-consent-safety.js");
const executor = read("src/content/cookie-banner-executor.js");
const localizationAudit = read("tools/cookie-banner-localization-audit.mjs");
const compositionAudit = read("tools/cookie-banner-utils-composition-audit.mjs");
const collaboratorAudit = read("tools/cookie-banner-collaborator-ownership-audit.mjs");
const platformAudit = read("tools/cookie-banner-platform-primitives-audit.mjs");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [storage, 'cookieBannerMode: "reject"', "default reject configuration"],
  [settings, 'Reject cookie banners when possible', "Settings reject option"],
  [policyRuntime, 'const REQUEST_KEYS = new Set(["type", "domain"]);', "exact policy request fields"],
  [policyRuntime, 'frameId.value !== 0', "top-frame sender binding"],
  [controller, 'const MAX_SCAN_ATTEMPTS = 16;', "scan-attempt ceiling"],
  [controller, 'const MAX_OBSERVE_MS = 30_000;', "observation deadline"],
  [controller, 'function selectUnambiguousCandidate(candidates)', "ambiguity-safe selection"],
  [utils, 'const MAX_COOKIE_BANNER_SCAN_NODES = 2_000;', "DOM scan ceiling"],
  [utils, 'const MAX_COOKIE_BANNER_TEXT_CHARS = 160;', "action text ceiling"],
  [utils, 'const MAX_CONSENT_CONTEXT_EVALUATIONS = 256;', "consent evaluation ceiling"],
  [utils, 'const MAX_ARIA_LABELLEDBY_IDS = 4;', "accessible-name reference ceiling"],
  [utils, 'function labelledBySnapshot(element)', "bounded aria-labelledby fallback"],
  [utils, 'targetRoot !== root || !labelReferenceSafe(target)', "same-root safe label reference"],
  [utils, 'normalize("NFKD")', "deterministic Latin decomposition"],
  [shadowRoots, 'const MAX_OPEN_SHADOW_ROOTS = 32;', "shadow helper root ceiling"],
  [consentSafety, 'STRONG_COOKIE_CONSENT_PATTERN', "strong consent pattern"],
  [executor, 'captureData(HTMLElementPrototype, "click")', "captured native click"],
  [executor, 'captureData(document, "elementFromPoint")', "captured document hit-test primitive"],
  [executor, 'if (!hitTestOwnsAction(snapshot.element)) return false;', "final pre-click hit test"]
]) requireText(source, needle, label);

for (const [needle, label] of [
  ['const EXPECTED_UTIL_KEYS = Object.freeze([', "composition utility schema"],
  ['const MAX_OVERRIDE_KEYS = 4;', "composition override ceiling"],
  ['Object.getOwnPropertyDescriptor(globalThis, UTILS_GLOBAL)', "composition global data descriptor"],
  ['Reflect.ownKeys(utils)', "composition own-key snapshot"],
  ['Object.isFrozen(utils)', "composition frozen utility requirement"],
  ['function snapshotOverrides(overrides)', "composition override snapshot"],
  ['function replaceUtils(overrides)', "composition safe replacement"]
]) requireText(composition, needle, label);
requireAbsent(composition, /\.\.\.utils|Object\.assign|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "utility composition persistence/network/profile surface");

for (const [needle, label] of [
  ['const LOCALIZED_REJECTION_PHRASES = Object.freeze([', "localized exact lexicon"],
  ['const MAX_LOCALIZED_REJECTION_PHRASES = 32;', "localized phrase-count ceiling"],
  ['const MAX_LOCALIZED_PHRASE_CHARS = 96;', "localized phrase-length ceiling"],
  ['const MAX_NORMALIZED_ACTION_CHARS = 160;', "localized normalized-action ceiling"],
  ['function normalizedActionText(value)', "localized normalized-result contract"],
  ['function baseRejectionScore(value)', "localized base-score result contract"],
  ['!Number.isSafeInteger(score) || score < 0 || score > 100', "localized base-score range"],
  ['function frozenDataDescriptor(object, key, enumerable)', "localized data descriptor validation"],
  ['function snapshotLocalizedTuple(entry)', "localized tuple snapshot"],
  ['function buildLocalizedLexicon(entries)', "localized lexicon builder"],
  ['const lookup = Object.create(null);', "localized null-prototype lookup"],
  ['const LOCALIZED_SCORE_BY_PHRASE = buildLocalizedLexicon(LOCALIZED_REJECTION_PHRASES);', "localized compiled lookup"],
  ['if (baseScore > 0) return baseScore;', "base rejection precedence"],
  ['if (!LOCALIZED_SCORE_BY_PHRASE) return 0;', "localized fail-closed validation gate"],
  ['composition.snapshotUtils()', "localized composition snapshot"],
  ['composition.replaceUtils({ rejectionScore })', "localized composition replacement"],
  ['"odrzuc wszystkie"', "Polish reject-all label"],
  ['"tylko niezbedne"', "Polish necessary-only label"],
  ['"avvisa alla"', "Swedish reject-all label"],
  ['"endast nodvandiga"', "Swedish necessary-only label"],
  ['"afvis alle"', "Danish reject-all label"],
  ['"kun nodvendige"', "Danish necessary-only label"],
  ['"avvis alle"', "Norwegian reject-all label"],
  ['"bare nodvendige"', "Norwegian necessary-only label"],
  ['"hylkaa kaikki"', "Finnish reject-all label"],
  ['"vain valttamattomat"', "Finnish necessary-only label"],
  ['"odmitnout vse"', "Czech reject-all label"],
  ['"pouze nezbytne"', "Czech necessary-only label"]
]) requireText(localeExtension, needle, label);
requireAbsent(localeExtension, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "localized lexicon persistence/network/profile surface");

for (const [needle, label] of [
  ['pliki cookie', "Polish strong cookie evidence"],
  ['kakor', "Swedish strong cookie evidence"],
  ['privatlivsvalg', "Danish strong privacy evidence"],
  ['informasjonskapsler', "Norwegian strong cookie evidence"],
  ['evästeet', "Finnish strong cookie evidence"],
  ['soubory cookie', "Czech strong cookie evidence"]
]) requireText(consentSafety, needle, label);
requireAbsent(consentSafety, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "consent-safety persistence/network/profile surface");

for (const [needle, label] of [
  ['const MAX_ACTION_RAW_CHARS = 512;', "action-source raw ceiling"],
  ['const MAX_ACTION_TEXT_CHARS = 160;', "action-source normalized ceiling"],
  ['const MAX_ACTION_TEXT_NODES = 32;', "action-source node ceiling"],
  ['const MAX_ACTION_ELEMENT_NODES = 128;', "action-source element ceiling"],
  ['const MAX_ARIA_REFERENCE_ELEMENT_NODES = 64;', "action-source aria element ceiling"],
  ['const MAX_UNICODE_FOLDED_CHARS = 1_024;', "Unicode fold ceiling"],
  ['function directChannelsAgree(element)', "direct-channel agreement gate"],
  ['function referencedLabelTreeSafe(target)', "referenced label descendant safety"],
  ['function actionTreeExcludesHiddenText(element)', "hidden text exclusion"],
  ['function sourceHasUnsupportedSemanticCodePoint(value)', "unsupported semantic script guard"],
  ['const MAX_NAVIGATION_ANCESTOR_STEPS = 16;', "navigation ancestry ceiling"],
  ['function navigationContainerUnsafe(element)', "navigation-container guard"],
  ['ownDataValue(composition, "snapshotUtils")', "action-source composition snapshot capture"],
  ['ownDataValue(composition, "replaceUtils")', "action-source composition replacement capture"],
  ['Reflect.apply(replaceUtils, composition, [{ textSnapshot }])', "action-source safe composition"]
]) requireText(actionSafety, needle, label);
requireAbsent(actionSafety, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "action-source persistence/network/profile surface");

for (const [needle, label] of [
  ['const MAX_ACTIVATION_ANCESTOR_STEPS = 16;', "secondary activation ancestry ceiling"],
  ['const MAX_EDITABLE_ANCESTOR_STEPS = 16;', "editable ancestry ceiling"],
  ['const MAX_CONTEXT_DESCENDANT_ELEMENTS = 128;', "context descendant ceiling"],
  ['const MAX_REFERENCED_LABEL_ELEMENTS = 64;', "editable referenced-label ceiling"],
  ['function activationAncestorUnsafe(element)', "secondary activation ancestor guard"],
  ['function explicitEditableState(element)', "explicit editable-state parser"],
  ['function editableDescendantsSafe(element', "editable action descendant guard"],
  ['function editableLabelledByTreesSafe(element)', "editable referenced-label guard"],
  ['function popupLaunchSemanticsSafe(element)', "aria-haspopup refusal"],
  ['function toggleSemanticsSafe(element)', "toggle semantics refusal"],
  ['function popoverTargetSemanticsSafe(element)', "popover-target refusal"],
  ['ownDataValue(composition, "snapshotUtils")', "action-context composition snapshot capture"],
  ['ownDataValue(composition, "replaceUtils")', "action-context composition replacement capture"],
  ['Reflect.apply(snapshotUtils, composition, [])', "action-context composition snapshot"],
  ['Reflect.apply(replaceUtils, composition, [{ textSnapshot }])', "action-context composition replacement"]
]) requireText(actionContext, needle, label);
requireAbsent(actionContext, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "action-context persistence/network/profile surface");

for (const [needle, label] of [
  ['const MAX_BUSY_ANCESTOR_STEPS = 16;', "busy ancestry ceiling"],
  ['const DECLARATIVE_COMMAND_ATTRIBUTES = Object.freeze(["command", "commandfor", "invokeaction", "invoketarget"]);', "declarative command attribute set"],
  ['function disclosureSemanticsSafe(element)', "aria-expanded disclosure refusal"],
  ['function formResetSemanticsSafe(element)', "form reset refusal"],
  ['function nativeRoleSemanticsSafe(element)', "native role override guard"],
  ['function busySemanticsSafe(element)', "busy context guard"],
  ['function controlledRegionSemanticsSafe(element)', "aria-controls refusal"],
  ['function declarativeCommandSemanticsSafe(element)', "declarative command refusal"],
  ['ownDataValue(composition, "snapshotUtils")', "action-semantics composition snapshot capture"],
  ['ownDataValue(composition, "replaceUtils")', "action-semantics composition replacement capture"],
  ['Reflect.apply(snapshotUtils, composition, [])', "action-semantics composition snapshot"],
  ['Reflect.apply(replaceUtils, composition, [{ textSnapshot }])', "action-semantics composition replacement"]
]) requireText(actionSemantics, needle, label);
requireAbsent(actionSemantics, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "action-semantics persistence/network/profile surface");

for (const [source, needle, label] of [
  [consentSafety, 'ownDataValue(utils, "boundedConsentContext")', "consent-safety captured utility collaborator"],
  [consentSafety, 'Object.defineProperty(globalThis, CONSENT_SAFETY_GLOBAL', "immutable consent-safety global"],
  [executor, 'ownDataValue(utils, "snapshotCandidate")', "executor captured candidate collaborator"],
  [executor, 'ownDataValue(globalThis, "DropAdsCookieBannerConsentSafety")', "executor captured consent global"],
  [executor, 'Object.defineProperty(globalThis, EXECUTOR_GLOBAL', "immutable executor global"],
  [controller, 'function exactFrozenApi(globalName, expectedKeys)', "controller exact frozen API validation"],
  [controller, 'exactFrozenApi("DropAdsCookieBannerExecutor"', "controller executor ownership"],
  [controller, 'exactFrozenApi("DropAdsCookieBannerShadowRoots"', "controller shadow ownership"],
  [controller, 'exactFrozenApi("DropAdsCookieBannerConsentSafety"', "controller consent ownership"],
  [shadowRoots, 'captureData(document, "createTreeWalker")', "shadow createTreeWalker capture"],
  [shadowRoots, 'captureData(TreeWalkerPrototype, "nextNode")', "shadow TreeWalker nextNode capture"],
  [shadowRoots, 'captureGetter(ElementPrototype, "shadowRoot")', "shadowRoot getter capture"],
  [shadowRoots, 'Object.defineProperty(globalThis, SHADOW_ROOTS_GLOBAL', "immutable shadow helper global"]
]) requireText(source, needle, label);

for (const [source, needle, label] of [
  [executor, 'captureData(ElementPrototype, "hasAttribute")', "executor semantic attribute capture"],
  [executor, 'captureGetter(NodePrototype, "isConnected")', "executor connected-state capture"],
  [executor, 'captureData(CSSStyleDeclarationPrototype, "getPropertyValue")', "executor style-value capture"],
  [executor, 'captureGetter(DOMRectReadOnlyPrototype, "width")', "executor geometry capture"],
  [executor, 'captureGetter(globalThis, "innerWidth")', "executor viewport capture"],
  [actionSafety, 'captureData(DocumentPrototype, "createTreeWalker")', "action-source tree-walker capture"],
  [actionSafety, 'captureData(TreeWalkerPrototype, "nextNode")', "action-source walker iteration capture"],
  [actionSafety, 'captureGetter(NodePrototype, "nodeValue")', "action-source node-value capture"],
  [actionSafety, 'captureData(ShadowRootPrototype, "getElementById")', "action-source shadow ID capture"],
  [actionSafety, 'captureGetter(HTMLInputElementPrototype, "value")', "action-source input value capture"],
  [actionContext, 'captureData(DocumentPrototype, "createTreeWalker")', "action-context tree-walker capture"],
  [actionContext, 'captureData(TreeWalkerPrototype, "nextNode")', "action-context walker iteration capture"],
  [actionContext, 'captureData(NodePrototype, "getRootNode")', "action-context root capture"],
  [actionContext, 'captureData(ShadowRootPrototype, "getElementById")', "action-context shadow ID capture"],
  [actionSemantics, 'captureData(ElementPrototype, "getAttribute")', "action-semantics attribute capture"],
  [actionSemantics, 'captureData(NodePrototype, "getRootNode")', "action-semantics root capture"],
  [actionSemantics, 'captureGetter(HTMLButtonElementPrototype, "type")', "action-semantics button type capture"],
  [actionSemantics, 'captureGetter(HTMLInputElementPrototype, "type")', "action-semantics input type capture"]
]) requireText(source, needle, label);

requireAbsent(utils, /element\.innerText|element\.textContent/, "unbounded action text materialization");
requireAbsent(utils, /text\.startsWith\(|text\.endsWith\(|text\.includes\(phrase\)/, "broad rejection-label matching");
requireAbsent(executor, /scrollIntoView|new MouseEvent|dispatchEvent|localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|analytics|telemetry/i, "executor synthetic/persistent/network surface");
requireAbsent(controller, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages/i, "controller persistence/network/profile surface");
requireAbsent(shadowRoots, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i, "shadow helper persistence/network surface");

requireText(localizationAudit, "cookie-banner-localization-audit: canonical M1002-M1017 localization invariants verified", "dedicated localization audit compatibility marker");
requireText(localizationAudit, "extended through M1028", "dedicated localization audit extension");
requireText(compositionAudit, "cookie-banner-utils-composition-audit: canonical M1022-M1028 utility composition invariants verified", "dedicated utility-composition audit marker");
requireText(collaboratorAudit, "cookie-banner-collaborator-ownership-audit: canonical M1032-M1037 collaborator ownership invariants verified", "dedicated collaborator-ownership audit marker");
requireText(platformAudit, "cookie-banner-platform-primitives-audit: canonical M1042-M1047 platform primitive invariants verified", "dedicated platform-primitives audit marker");

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry) throw new Error("cookie-banner content entry is missing from a browser manifest");
if (JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner content entry differs between Chromium and Firefox");
if (chromiumEntry.all_frames !== false) throw new Error("cookie-banner content runtime must remain top-frame-only");
if (JSON.stringify(chromiumEntry.js) !== JSON.stringify([
  "content/cookie-banner-utils.js",
  "content/cookie-banner-utils-composition.js",
  "content/cookie-banner-locale-extension.js",
  "content/cookie-banner-action-source-safety.js",
  "content/cookie-banner-action-context-safety.js",
  "content/cookie-banner-action-semantics-safety.js",
  "content/cookie-banner-shadow-roots.js",
  "content/cookie-banner-consent-safety.js",
  "content/cookie-banner-executor.js",
  "content/cookie-banner-controller.js"
])) throw new Error("cookie-banner content script order is not canonical");

// Historical milestone test files are intentionally not part of this source audit.
// Current executable regression coverage is owned by npm test; this gate validates
// the live cookie-banner implementation, privacy boundaries, and manifest wiring.

if (packageJson.scripts?.["cookie-banner-hardening-audit"] !== "node tools/cookie-banner-hardening-audit.mjs") throw new Error("cookie-banner-hardening-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-hardening-audit")) throw new Error("cookie-banner-hardening-audit is not wired into npm run check");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-utils-composition-audit")) throw new Error("utility-composition audit is not wired into npm run check");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-collaborator-ownership-audit")) throw new Error("collaborator-ownership audit is not wired into npm run check");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-platform-primitives-audit")) throw new Error("platform-primitives audit is not wired into npm run check");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-localization-audit")) throw new Error("localization audit is not wired into npm run check");

console.log("cookie-banner-hardening-audit: canonical M899-M909 cookie-banner invariants verified; canonical M899-M919 cookie-banner invariants verified; extended through M928; extended through M939; extended through M958; extended through M967; extended through M978; extended through M988; extended through M997; extended through M1008; extended through M1018; extended through M1029; extended through M1038; extended through M1048");
