import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const controller = read("src/content/cookie-banner-controller.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const pkg = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['const MAX_API_PROTOTYPE_DEPTH = 8;', "prototype capture ceiling"],
  ['function captureData(receiver, key)', "data descriptor capture"],
  ['function captureGetter(receiver, key)', "getter descriptor capture"],
  ['function readGetter(getter, receiver)', "exact getter invocation"],
  ['function capturedGlobalValue(key)', "extension global capture"],
  ['const topGetter = captureGetter(globalThis, "top")', "top getter"],
  ['const locationGetter = captureGetter(globalThis, "location")', "location getter"],
  ['const documentGetter = captureGetter(globalThis, "document")', "document getter"],
  ['const protocolGetter = captureGetter(location, "protocol")', "protocol getter"],
  ['const hostnameGetter = captureGetter(location, "hostname")', "hostname getter"],
  ['const documentElementGetter = captureGetter(pageDocument, "documentElement")', "document root getter"],
  ['const readyStateGetter = captureGetter(pageDocument, "readyState")', "ready-state getter"],
  ['if (readGetter(topGetter, globalThis) !== globalThis) return;', "top-frame gate"],
  ['const api = capturedGlobalValue("browser") ?? capturedGlobalValue("chrome")', "captured extension API global"],
  ['const runtime = captureData(browserApi, "runtime")', "captured runtime"],
  ['return captureMethod(runtime, "sendMessage")', "receiver-bound sendMessage"],
  ['const Observer = captureData(globalThis, "MutationObserver")', "captured observer constructor"],
  ['const ObserverPrototype = captureData(Observer, "prototype")', "captured observer prototype"],
  ['const observerObserve = captureData(ObserverPrototype, "observe")', "captured observer observe"],
  ['const observerDisconnect = captureData(ObserverPrototype, "disconnect")', "captured observer disconnect"],
  ['Reflect.apply(observerObserve, instance, [target, options])', "exact observer observe receiver"],
  ['Reflect.apply(observerDisconnect, instance, [])', "exact observer disconnect receiver"],
  ['const MAX_SCAN_ATTEMPTS = 16;', "scan-attempt ceiling"],
  ['const MAX_OBSERVE_MS = 30_000;', "observation deadline"],
  ['const MUTATION_SETTLE_MS = 150;', "mutation settle bound"],
  ['observedTargets.clear()', "observer target teardown"],
  ['exactFrozenApi("DropAdsCookieBannerExecutor"', "executor ownership"],
  ['exactFrozenApi("DropAdsCookieBannerShadowRoots"', "shadow helper ownership"],
  ['exactFrozenApi("DropAdsCookieBannerConsentSafety"', "consent helper ownership"],
  ['Object.freeze({ type: MESSAGE_TYPE, domain })', "domain-only policy message"]
]) requireText(controller, needle, label);

for (const pattern of [
  /globalThis\.browser\b|globalThis\.chrome\b/,
  /globalThis\.top\b|globalThis\.location\?\./,
  /document\.documentElement|document\.readyState/,
  /captureMethod\(instance, "observe"\)|captureMethod\(instance, "disconnect"\)/
]) requireAbsent(controller, pattern, "superseded live controller primitive");
requireAbsent(controller, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|document\.referrer|location\.href/i, "controller persistence/network-history/profile surface");

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry) throw new Error("cookie-banner content entry is missing");
if (JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner content entry differs between Chromium and Firefox");
if (chromiumEntry.all_frames !== false) throw new Error("cookie-banner runtime must remain top-frame-only");
const expectedOrder = [
  "content/cookie-banner-utils.js", "content/cookie-banner-utils-composition.js", "content/cookie-banner-locale-extension.js",
  "content/cookie-banner-action-source-safety.js", "content/cookie-banner-action-context-safety.js", "content/cookie-banner-action-semantics-safety.js",
  "content/cookie-banner-shadow-roots.js", "content/cookie-banner-consent-safety.js", "content/cookie-banner-executor.js", "content/cookie-banner-controller.js"
];
if (JSON.stringify(chromiumEntry.js) !== JSON.stringify(expectedOrder)) throw new Error("cookie-banner content script order is not canonical");

if (pkg.scripts?.["cookie-banner-controller-platform-audit"] !== "node tools/cookie-banner-controller-platform-audit.mjs") throw new Error("cookie-banner-controller-platform-audit package script is missing");
if (!pkg.scripts?.check?.includes("npm run cookie-banner-controller-platform-audit")) throw new Error("cookie-banner-controller-platform-audit is not wired into npm run check");

// Current controller platform invariants are validated directly above. Historical
// milestone test filenames are intentionally not required by this audit.

console.log("cookie-banner-controller-platform-audit: canonical M1062-M1066 controller platform invariants verified");
