import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireAbsent(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} must remain absent`); }

const executor = read("src/content/cookie-banner-executor.js");
const actionSource = read("src/content/cookie-banner-action-source-safety.js");
const actionContext = read("src/content/cookie-banner-action-context-safety.js");
const actionSemantics = read("src/content/cookie-banner-action-semantics-safety.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['captureData(ElementPrototype, "hasAttribute")', "executor hasAttribute capture"],
  ['captureData(ElementPrototype, "getAttribute")', "executor getAttribute capture"],
  ['captureData(NodePrototype, "getRootNode")', "executor getRootNode capture"],
  ['captureGetter(NodePrototype, "parentElement")', "executor parentElement capture"],
  ['captureGetter(NodePrototype, "isConnected")', "executor isConnected capture"],
  ['captureGetter(ShadowRootPrototype, "host")', "executor shadow host capture"],
  ['captureGetter(HTMLElementPrototype, "hidden")', "executor hidden capture"],
  ['captureGetter(HTMLFieldSetElementPrototype, "disabled")', "executor fieldset disabled capture"],
  ['captureData(CSSStyleDeclarationPrototype, "getPropertyValue")', "executor style value capture"],
  ['captureGetter(DOMRectReadOnlyPrototype, "width")', "executor rect width capture"],
  ['captureGetter(globalThis, "innerWidth")', "executor viewport width capture"],
  ['Reflect.apply(nativeStyleGetPropertyValue, style, [property])', "executor exact-receiver style read"],
  ['Reflect.apply(nativeGetRootNode, element, [])', "executor exact-receiver root read"]
]) requireText(executor, needle, label);
requireAbsent(executor, /current\.hasAttribute|current\.getAttribute|current\.hidden|element\?\.getRootNode|element\?\.parentElement|element\?\.isConnected|style\.(?:display|visibility|opacity|pointerEvents)|rect\.(?:left|right|top|bottom|width|height)|globalThis\.(?:innerWidth|innerHeight)/, "executor live semantic/style/geometry primitive reads");

for (const [needle, label] of [
  ['captureData(DocumentPrototype, "createTreeWalker")', "action-source tree walker capture"],
  ['captureData(TreeWalkerPrototype, "nextNode")', "action-source walker iteration capture"],
  ['captureData(ElementPrototype, "getAttribute")', "action-source attribute capture"],
  ['captureGetter(NodePrototype, "nodeValue")', "action-source nodeValue capture"],
  ['captureData(NodePrototype, "getRootNode")', "action-source root capture"],
  ['captureData(ShadowRootPrototype, "getElementById")', "action-source shadow ID lookup capture"],
  ['captureGetter(HTMLInputElementPrototype, "value")', "action-source input value capture"],
  ['const SHOW_TEXT = ownDataValue(NodeFilterObject, "SHOW_TEXT")', "action-source SHOW_TEXT capture"],
  ['Reflect.apply(nativeTreeWalkerNextNode, walker, [])', "action-source exact-receiver walker iteration"]
]) requireText(actionSource, needle, label);
requireAbsent(actionSource, /document\.createTreeWalker|walker\.nextNode\(|element\?\.getAttribute|element\?\.hasAttribute|element\?\.getRootNode|element\?\.parentElement|instanceof HTMLInputElement/, "action-source live DOM primitive reads");

for (const [needle, label] of [
  ['captureData(DocumentPrototype, "createTreeWalker")', "action-context tree walker capture"],
  ['captureData(TreeWalkerPrototype, "nextNode")', "action-context walker iteration capture"],
  ['captureData(ElementPrototype, "getAttribute")', "action-context attribute capture"],
  ['captureData(NodePrototype, "getRootNode")', "action-context root capture"],
  ['captureData(ShadowRootPrototype, "getElementById")', "action-context shadow ID lookup capture"],
  ['Reflect.apply(nativeCreateTreeWalker, document, [element, SHOW_ELEMENT])', "action-context exact-receiver traversal"]
]) requireText(actionContext, needle, label);
requireAbsent(actionContext, /document\.createTreeWalker|walker\.nextNode\(|element\?\.getAttribute|element\?\.hasAttribute|element\?\.getRootNode|element\?\.parentElement|root\.getElementById/, "action-context live DOM primitive reads");

for (const [needle, label] of [
  ['captureData(ElementPrototype, "getAttribute")', "action-semantics attribute capture"],
  ['captureGetter(ElementPrototype, "tagName")', "action-semantics tag capture"],
  ['captureData(NodePrototype, "getRootNode")', "action-semantics root capture"],
  ['captureGetter(HTMLButtonElementPrototype, "type")', "action-semantics button type capture"],
  ['captureGetter(HTMLInputElementPrototype, "type")', "action-semantics input type capture"],
  ['Reflect.apply(nativeGetRootNode, element, [])', "action-semantics exact-receiver root read"]
]) requireText(actionSemantics, needle, label);
requireAbsent(actionSemantics, /element\?\.hasAttribute|element\?\.getAttribute|current\.hasAttribute|current\.getAttribute|element\?\.tagName|element\?\.type|element\?\.getRootNode|element\?\.parentElement/, "action-semantics live DOM primitive reads");

for (const [source, label] of [[executor, "executor"], [actionSource, "action-source"], [actionContext, "action-context"], [actionSemantics, "action-semantics"]]) {
  requireAbsent(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages/i, `${label} persistence/network/profile surface`);
}

function cookieEntry(manifest) { return manifest.content_scripts?.find((entry) => entry.js?.includes("content/cookie-banner-controller.js")); }
const chromiumEntry = cookieEntry(chromium);
const firefoxEntry = cookieEntry(firefox);
if (!chromiumEntry || !firefoxEntry || JSON.stringify(chromiumEntry) !== JSON.stringify(firefoxEntry)) throw new Error("cookie-banner browser script parity is missing");
if (JSON.stringify(chromiumEntry.js) !== JSON.stringify([
  "content/cookie-banner-utils.js", "content/cookie-banner-utils-composition.js", "content/cookie-banner-locale-extension.js",
  "content/cookie-banner-action-source-safety.js", "content/cookie-banner-action-context-safety.js", "content/cookie-banner-action-semantics-safety.js",
  "content/cookie-banner-shadow-roots.js", "content/cookie-banner-consent-safety.js", "content/cookie-banner-executor.js", "content/cookie-banner-controller.js"
])) throw new Error("cookie-banner content script order is not canonical");
if (chromiumEntry.all_frames !== false) throw new Error("cookie-banner runtime must remain top-frame-only");

if (packageJson.scripts?.["cookie-banner-platform-primitives-audit"] !== "node tools/cookie-banner-platform-primitives-audit.mjs") throw new Error("cookie-banner-platform-primitives-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run cookie-banner-platform-primitives-audit")) throw new Error("platform-primitives audit is not wired into npm run check");

// Current platform primitive boundaries are checked directly above. Historical
// milestone test-file presence is intentionally not part of this audit.

console.log("cookie-banner-platform-primitives-audit: canonical M1042-M1047 platform primitive invariants verified");
