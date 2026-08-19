import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const utils = read("src/content/cookie-banner-utils.js");
const composition = read("src/content/cookie-banner-utils-composition.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['const UTILS_GLOBAL = "DropAdsCookieBannerUtils";', "base utility global name"],
  ['const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;', "platform prototype depth"],
  ['function captureDescriptor(receiver, key)', "bounded descriptor capture"],
  ['function captureData(receiver, key)', "data descriptor capture"],
  ['function captureGetter(receiver, key)', "getter descriptor capture"],
  ['Object.getOwnPropertyDescriptor(globalThis, UTILS_GLOBAL)', "pre-existing utility global check"],
  ['Object.defineProperty(globalThis, UTILS_GLOBAL', "immutable utility publication"],
  ['enumerable: false', "non-enumerable utility publication"],
  ['writable: false', "non-writable utility publication"],
  ['configurable: false', "non-configurable utility publication"],
  ['captureData(DocumentPrototype, "createTreeWalker")', "createTreeWalker capture"],
  ['captureData(TreeWalkerPrototype, "nextNode")', "TreeWalker nextNode capture"],
  ['captureGetter(NodePrototype, "nodeValue")', "Node nodeValue capture"],
  ['captureData(NodePrototype, "getRootNode")', "Node getRootNode capture"],
  ['captureGetter(NodePrototype, "parentElement")', "Node parentElement capture"],
  ['captureGetter(NodePrototype, "isConnected")', "Node isConnected capture"],
  ['captureData(ElementPrototype, "getAttribute")', "Element getAttribute capture"],
  ['captureData(ElementPrototype, "hasAttribute")', "Element hasAttribute capture"],
  ['captureGetter(ElementPrototype, "tagName")', "Element tagName capture"],
  ['captureData(ElementPrototype, "closest")', "Element closest capture"],
  ['captureGetter(ElementPrototype, "shadowRoot")', "Element shadowRoot capture"],
  ['captureGetter(HTMLInputElementPrototype, "value")', "input value capture"],
  ['captureGetter(HTMLInputElementPrototype, "type")', "input type capture"],
  ['captureGetter(HTMLInputElementPrototype, "disabled")', "input disabled capture"],
  ['captureGetter(HTMLButtonElementPrototype, "type")', "button type capture"],
  ['captureGetter(HTMLButtonElementPrototype, "disabled")', "button disabled capture"],
  ['captureGetter(HTMLButtonElementPrototype, "form")', "button form capture"],
  ['Reflect.apply(nativeCreateTreeWalker, document, [root, whatToShow])', "exact createTreeWalker receiver"],
  ['Reflect.apply(nativeTreeWalkerNextNode, walker, [])', "exact walker receiver"],
  ['Reflect.apply(nativeShadowRootGetter, element, [])', "exact shadowRoot receiver"],
  ['Reflect.apply(nativeClosest, element,', "exact closest receiver"],
  ['const scanRoot = root || documentElement();', "captured default discovery root"],
  ['const walker = createTreeWalker(current.root, SHOW_ELEMENT);', "captured element traversal"],
  ['const shadowRoot = openShadowRoot(node);', "captured open shadow discovery"],
  ['const walker = createTreeWalker(element, SHOW_TEXT);', "captured text traversal"],
  ['const target = rootElementById(root, id);', "captured same-root label lookup"],
  ['const body = documentBody();', "captured document body"],
  ['const root = documentElement();', "captured document element"],
  ['current = parentElement(current);', "captured consent ancestry"]
]) requireText(utils, needle, label);

for (const marker of [
  'MAX_COOKIE_BANNER_SCAN_NODES = 2_000', 'MAX_COOKIE_BANNER_CANDIDATES = 64', 'MAX_ACTION_TEXT_NODES = 32',
  'MAX_ACTION_RAW_CHARS = 512', 'MAX_ARIA_LABELLEDBY_IDS = 4', 'MAX_CONSENT_ANCESTOR_STEPS = 10',
  'MAX_CONSENT_TEXT_NODES = 96', 'MAX_CONSENT_CONTEXT_CHARS = 1_200', 'MAX_CONSENT_CONTEXT_EVALUATIONS = 256',
  'MAX_COOKIE_BANNER_SHADOW_ROOTS = 32', 'MAX_COOKIE_BANNER_SHADOW_DEPTH = 4'
]) requireText(utils, marker, `work ceiling ${marker}`);

requireText(composition, 'const EXPECTED_UTIL_KEYS = Object.freeze([', "composition exact utility schema");
requireText(composition, 'Object.isFrozen(utils)', "composition frozen utility requirement");
requireAbsent(utils, /globalThis\.DropAdsCookieBannerUtils\s*=|document\.createTreeWalker\(|walker\.nextNode\(|instanceof HTMLInputElement|instanceof HTMLButtonElement|node\?\.shadowRoot|node\.shadowRoot|current\.parentElement|document\.body|document\.documentElement/, "superseded live DOM access");
requireAbsent(utils, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i, "base utility persistence/network/profile surface");

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry || JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner manifest parity is missing");
if (chromiumEntry.js[0] !== "content/cookie-banner-utils.js" || chromiumEntry.js[1] !== "content/cookie-banner-utils-composition.js") throw new Error("base utility/composition script order is not canonical");

if (packageJson.scripts?.["cookie-banner-utils-platform-audit"] !== "node tools/cookie-banner-utils-platform-audit.mjs") throw new Error("cookie-banner-utils-platform-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-utils-platform-audit")) throw new Error("cookie-banner-utils-platform-audit is not wired into npm run check");

// Current base-utility platform invariants are checked directly above. Historical
// milestone test filenames are intentionally not required by this audit.

console.log("cookie-banner-utils-platform-audit: canonical M1052-M1058 base utility platform invariants verified");
