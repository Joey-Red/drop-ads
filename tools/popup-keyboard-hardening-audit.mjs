import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function requireMatch(source, pattern, label) { if (!pattern.test(source)) throw new Error(`${label} is missing`); }

const html = read("src/popup/index.html");
const keyboard = read("src/popup/popup-keyboard.js");
const catalog = read("src/popup/shortcut-catalog.js");
const bindings = read("src/popup/shortcut-bindings.js");
const availability = read("src/popup/shortcut-availability.js");
const semantics = read("src/popup/popup-semantics.js");
const css = read("src/popup/popup.css");
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['id="enabled" type="checkbox" aria-label="Global blocking" aria-keyshortcuts="G"', "global shortcut relationship"],
  ['id="site-enabled" type="checkbox" aria-keyshortcuts="S"', "site shortcut relationship"],
  ['id="cookie-site-enabled" type="checkbox" aria-keyshortcuts="C"', "cookie shortcut relationship"],
  ['id="pause-site" type="button" aria-keyshortcuts="P"', "pause shortcut relationship"],
  ['id="pick-element" type="button" aria-keyshortcuts="E"', "picker shortcut relationship"],
  ['id="settings" type="button" aria-keyshortcuts="O"', "Settings shortcut relationship"],
  ['<details id="shortcut-help" class="shortcut-help"', "native shortcut-help disclosure"],
  ['id="shortcut-help-summary" aria-keyshortcuts="?"', "shortcut-help discovery relationship"],
  ['id="shortcut-help-list" class="shortcut-list"', "shortcut-help list"],
  ['Unavailable shortcuts are marked below.', "generic unavailable guidance"]
]) requireText(html, needle, label);

for (const [needle, label] of [
  ['import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";', "shortcut catalog import"],
  ['import { bindPopupShortcutControls } from "./shortcut-bindings.js";', "shortcut binding import"],
  ['import { popupShortcutControlAvailable } from "./shortcut-availability.js";', "shared actionability import"],
  ['const shortcutDefinitions = POPUP_SHORTCUTS;', "canonical shortcut inventory"],
  ['const shortcutControls = bindPopupShortcutControls(document, shortcutDefinitions);', "native shortcut bindings"],
  ['if (!shortcutCatalogReady || !pageActive || event.defaultPrevented || event.repeat || event.isComposing) return;', "event/catalog guards"],
  ['if (event.ctrlKey || event.metaKey || event.altKey) return;', "modifier guard"],
  ['if (textEntryTarget(event.target)) return;', "text-entry guard"],
  ['if (event.shiftKey) return;', "shifted-letter guard"],
  ['return popupShortcutControlAvailable(control, { pageActive, popupMain });', "shared actionability use"],
  ['control.click();', "native click delegation"],
  ['function shortcutControlForHelpItem(item)', "exact help target resolver"],
  ['item?.dataset?.shortcutControl !== definition.controlId', "help/control identity guard"],
  ['control.id !== definition.controlId', "resolved-control identity guard"],
  ['item.hidden = false;', "unavailable shortcut discoverability"],
  ['item.setAttribute("aria-disabled", "true")', "unavailable semantics"],
  ['item.removeAttribute("aria-disabled")', "available semantics"],
  ['function syncShortcutDisclosureMetadata()', "disclosure metadata owner"],
  ['shortcutHelp?.open ? "? Escape" : "?"', "open disclosure Escape relationship"],
  ['shortcutHelp?.addEventListener("toggle", handleShortcutHelpToggle)', "native disclosure lifecycle"],
  ['attributeFilter: ["hidden", "disabled", "aria-busy"]', "bounded availability observer"],
  ['shortcutAvailabilityObserver?.disconnect()', "availability observer teardown"],
  ['shortcutHelp?.removeEventListener("toggle", handleShortcutHelpToggle)', "disclosure listener teardown"],
  ['window.removeEventListener("keydown", handlePopupShortcut);', "keyboard teardown"]
]) requireText(keyboard, needle, label);
if (/item\.hidden\s*=\s*true/.test(keyboard)) throw new Error("unavailable shortcut rows must remain discoverable");

for (const [needle, label] of [
  ['export const POPUP_SHORTCUTS = Object.freeze(', "frozen shortcut catalog"],
  ['{ key: "g", shortcut: "G", controlId: "enabled"', "global shortcut entry"],
  ['{ key: "o", shortcut: "O", controlId: "settings"', "Settings shortcut entry"]
]) requireText(catalog, needle, label);
for (const [needle, label] of [
  ['const MAX_POPUP_SHORTCUTS = 16;', "shortcut work ceiling"],
  ['const SAFE_CONTROL_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;', "control-id grammar"],
  ['keys.has(key) || controlIds.has(controlId)', "duplicate routing rejection"],
  ['documentLike.getElementById(controlId)', "exact control resolution"],
  ['return Object.freeze(controls);', "frozen binding result"]
]) requireText(bindings, needle, label);
for (const [needle, label] of [
  ['!pageActive || !control?.isConnected || control.disabled || control.hidden === true', "fail-closed availability"],
  ['popupMain?.getAttribute?.("aria-busy") === "true"', "popup busy guard"],
  ['control.getAttribute?.("aria-busy") === "true"', "control busy guard"],
  ['control.closest?.("[hidden]")', "hidden-ancestor guard"],
  ['control.closest?.(\'[aria-busy="true"]\')', "busy-ancestor guard"]
]) requireText(availability, needle, label);
for (const [needle, label] of [
  ['function shortcutAvailabilityMarker(row)', "unavailable marker"],
  ['marker.textContent = "Unavailable"', "generic unavailable marker"],
  ['function syncShortcutPresentation()', "presentation owner"],
  ['row.getAttribute("aria-disabled") === "true"', "authoritative unavailable state"],
  ['shortcutAvailabilityMarker(row).hidden = !unavailable', "marker visibility"],
  ['attributeFilter: ["aria-disabled"]', "presentation observer"],
  ['shortcutPresentationObserver?.disconnect()', "presentation teardown"]
]) requireText(semantics, needle, label);
if (/popupShortcutControlAvailable|bindPopupShortcutControls|POPUP_SHORTCUTS/.test(semantics)) throw new Error("popup semantics must not recompute shortcut actionability");

for (const [pattern, label] of [
  [/\.shortcut-help summary \{[^}]*min-height: 44px;/s, "shortcut-help 44px target"],
  [/\.shortcut-help\[open\] summary \{[^}]*border-bottom:/s, "open disclosure divider"],
  [/\.shortcut-list li \{[^}]*grid-template-columns:/s, "shortcut-help readable rows"],
  [/\.shortcut-list li\[aria-disabled="true"\] \{[^}]*opacity:/s, "unavailable presentation"],
  [/kbd \{[^}]*border: 1px solid currentColor;/s, "keycap contrast"],
  [/@media \(max-width: 360px\)[\s\S]*\.shortcut-list li/s, "narrow reflow"],
  [/@media \(prefers-reduced-motion: reduce\)/, "reduced motion"],
  [/@media \(prefers-contrast: more\)[\s\S]*\.shortcut-help/s, "increased contrast"],
  [/@media \(forced-colors: active\)[\s\S]*\.shortcut-help/s, "forced colors"]
]) requireMatch(css, pattern, label);

for (const source of [keyboard, availability, semantics]) {
  if (/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|analytics|telemetry/i.test(source)) throw new Error("popup keyboard surface must remain local and non-persistent");
}
if (/neon|glow|text-shadow|box-shadow/i.test(css)) throw new Error("popup shortcut help must remain matte and non-neon");

if (packageJson.scripts?.["popup-keyboard-hardening-audit"] !== "node tools/popup-keyboard-hardening-audit.mjs") throw new Error("popup-keyboard-hardening-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run popup-keyboard-hardening-audit")) throw new Error("popup-keyboard-hardening-audit is not wired into npm run check");

// The hardening contract is validated directly from current shipped source above.
// Historical milestone test-file presence is intentionally not part of this audit.

console.log("popup-keyboard-hardening-audit: canonical M859-M867 popup keyboard/help invariants verified");
