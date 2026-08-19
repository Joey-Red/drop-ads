import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

const selector = read("src/content/selector-utils.js");
const ui = read("src/content/picker-ui.js");
const picker = read("src/content/picker.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ["color-scheme: light dark", "picker color-scheme support"],
  ["background: Canvas", "picker system background"],
  ["button { min-height:44px", "picker 44px action target floor"],
  ["@media (forced-colors: active)", "picker forced-colors support"],
  ["@media (prefers-contrast: more)", "picker increased-contrast support"],
  ["@media (max-width: 420px)", "picker narrow reflow"],
  ["#actions { flex-direction:column; }", "picker narrow stacked actions"],
  ["#actions button { width:100%; box-sizing:border-box; }", "picker narrow full-width actions"],
  ["max-height: calc(100vh - 44px)", "picker viewport height bound"],
  ['id="panel" role="dialog" tabindex="-1" aria-keyshortcuts="Escape" aria-labelledby="drop-ads-picker-title" aria-describedby="message privacy" aria-busy="false"', "picker labelled non-modal dialog"],
  ['id="message" role="status" aria-live="polite" aria-atomic="true"', "picker live atomic status"],
  ['role="region" aria-label="Selector preview"', "picker selector-preview semantics"],
  ['role="group" aria-label="Picker actions"', "picker action-group semantics"],
  ['id="save" type="button" aria-describedby="candidate message privacy"', "picker save descriptive relationship"],
  ['id="cancel" type="button" aria-keyshortcuts="Escape" aria-describedby="message privacy"', "picker Escape shortcut relationship"],
  ["Local only. Drop Ads does not retain page contents", "picker local-only privacy guidance"],
  ['aria-busy="false"', "picker initial busy semantics"],
  ['panel.setAttribute("aria-busy", busy ? "true" : "false")', "picker busy synchronization"],
  ["if (wasBusy && !busy && host.isConnected === true)", "picker retry focus recovery"],
  ["queueMicrotask(() =>", "picker programmatic focus entry"],
  ["panel.focus()", "picker dialog focus entry"],
  ["busyObserver?.disconnect()", "picker busy observer disposal"],
  ["busyObserver = null", "picker busy observer release"],
  ["wasBusy = false", "picker retry state reset"],
  ["globalThis.DropAdsPickerUi = Object.freeze({ create })", "frozen picker UI export"]
]) requireText(ui, needle, label);

for (const [needle, label] of [
  ["const siblingSnapshot = [];", "picker sibling snapshot"],
  ["siblingSnapshot.push(sibling);", "picker sibling snapshot population"],
  ["parent.children !== children || children.length !== length", "picker sibling collection revalidation"],
  ["children[index] !== siblingSnapshot[index]", "picker sibling entry revalidation"],
  ["Picker sibling list changed during selection", "picker torn sibling fail-closed path"]
]) requireText(selector, needle, label);

requireText(picker, "const pickerUi = globalThis.DropAdsPickerUi;", "picker UI collaborator");
requireText(picker, "ui = pickerUi.create(host);", "picker UI construction boundary");
requireText(picker, "ui?.dispose?.()", "picker UI teardown boundary");

for (const [manifest, name] of [[chromium, "Chromium"], [firefox, "Firefox"]]) {
  const scripts = manifest.content_scripts?.flatMap((entry) => entry.js ?? []) ?? [];
  const selectorIndex = scripts.indexOf("content/selector-utils.js");
  const guardIndex = scripts.indexOf("content/picker-save-guard.js");
  const uiIndex = scripts.indexOf("content/picker-ui.js");
  const pickerIndex = scripts.indexOf("content/picker.js");
  if (!(selectorIndex >= 0 && selectorIndex < guardIndex && guardIndex < uiIndex && uiIndex < pickerIndex)) {
    throw new Error(`${name} picker selector/save-guard/UI/runtime order is invalid`);
  }
}

// Picker accessibility/manifest behavior is checked directly above; npm test owns
// executable regressions rather than this audit requiring historical filenames.

if (packageJson.scripts?.["picker-ui-accessibility-audit"] !== "node tools/picker-ui-accessibility-audit.mjs") {
  throw new Error("picker-ui-accessibility-audit package script is missing");
}
if (!packageJson.scripts?.check?.includes("npm run picker-ui-accessibility-audit")) {
  throw new Error("picker-ui-accessibility-audit is not wired into npm run check");
}

console.log("picker-ui-accessibility-audit: canonical picker UI invariants verified through M877");
