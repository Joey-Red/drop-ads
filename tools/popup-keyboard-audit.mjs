import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}
function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) throw new Error(`${label} is missing`);
}

const html = read("src/popup/index.html");
const keyboard = read("src/popup/popup-keyboard.js");
const catalog = read("src/popup/shortcut-catalog.js");
const bindings = read("src/popup/shortcut-bindings.js");
const availability = read("src/popup/shortcut-availability.js");
const semantics = read("src/popup/popup-semantics.js");
const css = read("src/popup/popup.css");
const packageJson = JSON.parse(read("package.json"));

requireText(html, '<script type="module" src="popup-keyboard.js"></script>', "popup keyboard module");
requireText(html, '<details id="shortcut-help" class="shortcut-help"', "native shortcut disclosure");
requireText(html, 'id="shortcut-help-summary" aria-keyshortcuts="?"', "shortcut help key relationship");
requireText(html, 'id="shortcut-help-list" class="shortcut-list" aria-label="Popup keyboard shortcuts"', "shortcut help list relationship");
for (const [id, key] of [
  ["enabled", "G"], ["site-enabled", "S"], ["cookie-site-enabled", "C"], ["pause-site", "P"], ["pick-element", "E"], ["settings", "O"]
]) requireMatch(html, new RegExp(`id="${id}"[^>]*aria-keyshortcuts="${key}"`), `${id} keyboard relationship`);

for (const [needle, label] of [
  ['import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";', "reviewed shortcut catalog import"],
  ['import { bindPopupShortcutControls } from "./shortcut-bindings.js";', "shortcut binding boundary import"],
  ['import { popupShortcutControlAvailable } from "./shortcut-availability.js";', "shared availability boundary import"],
  ['const shortcutDefinitions = POPUP_SHORTCUTS;', "canonical shortcut inventory"],
  ['const shortcutControls = bindPopupShortcutControls(document, shortcutDefinitions);', "native-control binding"],
  ['event.defaultPrevented || event.repeat || event.isComposing', "repeat/composition guard"],
  ['event.ctrlKey || event.metaKey || event.altKey', "modifier guard"],
  ['if (event.shiftKey) return;', "shift guard for letter shortcuts"],
  ['if (textEntryTarget(event.target)) return;', "text-entry guard"],
  ['return popupShortcutControlAvailable(control, { pageActive, popupMain });', "shared actionability routing"],
  ['control.click();', "native click delegation"],
  ['function shortcutControlForHelpItem(item)', "exact help-row target resolver"],
  ['item?.dataset?.shortcutControl !== definition.controlId', "help/control identity guard"],
  ['control.id !== definition.controlId', "resolved control identity guard"],
  ['item.hidden = false;', "unavailable shortcut discoverability"],
  ['item.setAttribute("aria-disabled", "true")', "unavailable shortcut state"],
  ['item.removeAttribute("aria-disabled")', "available shortcut state"],
  ['attributeFilter: ["hidden", "disabled", "aria-busy"]', "bounded availability observation"],
  ['function syncShortcutDisclosureMetadata()', "shortcut disclosure metadata owner"],
  ['shortcutHelp?.open ? "? Escape" : "?"', "open-state Escape relationship"],
  ['shortcutHelp?.addEventListener("toggle", handleShortcutHelpToggle)', "native disclosure toggle lifecycle"],
  ['shortcutHelp?.removeEventListener("toggle", handleShortcutHelpToggle)', "native disclosure toggle teardown"],
  ['if (rawKey === "?")', "help toggle shortcut"],
  ['if (rawKey === "Escape" && shortcutHelp?.open)', "help Escape recovery"],
  ['shortcutHelpSummary.focus()', "help focus recovery"],
  ['shortcutAvailabilityObserver?.disconnect()', "availability observer teardown"],
  ['window.removeEventListener("keydown", handlePopupShortcut)', "keyboard listener teardown"]
]) requireText(keyboard, needle, label);
if (/item\.hidden\s*=\s*true/.test(keyboard)) throw new Error("unavailable shortcut rows must remain discoverable");

for (const [needle, label] of [
  ['export const POPUP_SHORTCUTS = Object.freeze(', "frozen shortcut catalog"],
  ['controlId: "enabled"', "global shortcut catalog entry"],
  ['controlId: "site-enabled"', "site shortcut catalog entry"],
  ['controlId: "settings"', "Settings shortcut catalog entry"]
]) requireText(catalog, needle, label);
for (const [needle, label] of [
  ['const MAX_POPUP_SHORTCUTS = 16;', "shortcut catalog work ceiling"],
  ['const SAFE_CONTROL_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;', "shortcut control-id grammar"],
  ['keys.has(key) || controlIds.has(controlId)', "duplicate routing rejection"],
  ['documentLike.getElementById(controlId)', "exact native-control resolution"],
  ['return Object.freeze(controls);', "frozen shortcut binding result"]
]) requireText(bindings, needle, label);
for (const [needle, label] of [
  ['!pageActive || !control?.isConnected || control.disabled || control.hidden === true', "fail-closed control availability"],
  ['popupMain?.getAttribute?.("aria-busy") === "true"', "popup busy guard"],
  ['control.getAttribute?.("aria-busy") === "true"', "control busy guard"],
  ['control.closest?.("[hidden]")', "hidden ancestor guard"],
  ['control.closest?.(\'[aria-busy="true"]\')', "busy ancestor guard"]
]) requireText(availability, needle, label);

for (const [needle, label] of [
  ['function syncShortcutPresentation()', "shortcut presentation owner"],
  ['row.getAttribute("aria-disabled") === "true"', "authoritative unavailable presentation state"],
  ['shortcutAvailabilityMarker(row).hidden = !unavailable', "visible unavailable marker parity"],
  ['attributeFilter: ["aria-disabled"]', "presentation observer boundary"],
  ['shortcutPresentationObserver?.disconnect()', "presentation observer teardown"]
]) requireText(semantics, needle, label);
if (/popupShortcutControlAvailable|bindPopupShortcutControls|POPUP_SHORTCUTS/.test(semantics)) {
  throw new Error("popup semantics must consume shortcut availability state, not recompute actionability");
}

for (const [pattern, label] of [
  [/\.shortcut-help summary \{[^}]*min-height: 44px;/s, "shortcut help target size"],
  [/\.shortcut-list li\[aria-disabled="true"\] \{[^}]*opacity:/s, "unavailable shortcut presentation"],
  [/\.shortcut-availability \{[^}]*font-weight: 650;/s, "unavailable marker presentation"],
  [/kbd \{[^}]*border: 1px solid currentColor;/s, "shortcut keycap contrast"],
  [/@media \(max-width: 360px\)[\s\S]*\.shortcut-list li/s, "shortcut help narrow reflow"],
  [/@media \(prefers-contrast: more\)[\s\S]*\.shortcut-help/s, "shortcut help increased contrast"],
  [/@media \(forced-colors: active\)[\s\S]*\.shortcut-help/s, "shortcut help forced colors"],
  [/@media \(prefers-reduced-motion: reduce\)/, "shortcut help reduced motion"]
]) requireMatch(css, pattern, label);

if (packageJson.scripts?.["popup-keyboard-audit"] !== "node tools/popup-keyboard-audit.mjs") throw new Error("popup-keyboard-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run popup-keyboard-audit")) throw new Error("popup-keyboard-audit is not wired into npm run check");
if (/localStorage|sessionStorage|indexedDB|history\.|analytics|telemetry|sendBeacon|WebSocket|EventSource/i.test(keyboard + availability + semantics)) {
  throw new Error("popup keyboard surface must remain page-local and privacy-minimal");
}

// Live shortcut routing, accessibility, and privacy contracts are checked above.
// Historical milestone test filenames are intentionally not required here.

console.log("popup-keyboard-audit: canonical popup keyboard interaction invariants verified through M867");
