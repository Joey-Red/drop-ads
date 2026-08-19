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
const css = read("src/popup/popup.css");
const semantics = read("src/popup/popup-semantics.js");
const keyboard = read("src/popup/popup-keyboard.js");
const availability = read("src/popup/shortcut-availability.js");
const catalog = read("src/popup/shortcut-catalog.js");
const bindings = read("src/popup/shortcut-bindings.js");
const helpContract = read("src/popup/shortcut-help-contract.js");
const popup = read("src/popup/popup.js");

for (const [needle, label] of [
  ['<main id="popup-main" aria-labelledby="popup-title" aria-describedby="popup-privacy-note" aria-busy="false">', "popup privacy-described main landmark"],
  ['id="popup-privacy-note">Local only · no telemetry</span>', "visible popup privacy boundary"],
  ['id="global-help" class="control-help">Master switch. Turning blocking off keeps your local rules and exceptions saved.</p>', "master switch persistence guidance"],
  ['class="site-actions" role="group" aria-labelledby="site-name" aria-describedby="session-status site-help"', "site action visible-context group"],
  ['<details id="shortcut-help" class="shortcut-help"', "popup shortcut help disclosure"],
  ['id="shortcut-help-list" class="shortcut-list" aria-label="Popup keyboard shortcuts"', "named shortcut help list"],
  ['<script type="module" src="popup-semantics.js"></script>', "popup semantics module load"],
  ['<script type="module" src="popup-keyboard.js"></script>', "popup keyboard module load"]
]) requireText(html, needle, label);

for (const [pattern, label] of [
  [/id="shortcut-help-summary"[^>]*aria-keyshortcuts="\?"[^>]*aria-controls="shortcut-help-list"[^>]*aria-describedby="shortcut-help-note"/, "shortcut help summary relationships"],
  [/id="enabled"[^>]*aria-keyshortcuts="G"/, "global shortcut metadata"],
  [/id="site-enabled"[^>]*aria-keyshortcuts="S"/, "site shortcut metadata"],
  [/id="cookie-site-enabled"[^>]*aria-keyshortcuts="C"/, "cookie shortcut metadata"],
  [/id="pause-site"[^>]*aria-keyshortcuts="P"/, "pause shortcut metadata"],
  [/id="pick-element"[^>]*aria-keyshortcuts="E"/, "picker shortcut metadata"],
  [/id="settings"[^>]*aria-keyshortcuts="O"/, "Settings shortcut metadata"]
]) requireMatch(html, pattern, label);

for (const [needle, label] of [
  ['function shortcutAvailabilityMarker(row)', "visible unavailable shortcut marker owner"],
  ['marker.textContent = "Unavailable";', "visible unavailable shortcut marker"],
  ['function syncShortcutPresentation()', "shortcut presentation owner"],
  ['row.getAttribute("aria-disabled") === "true"', "authoritative shortcut availability presentation"],
  ['shortcutAvailabilityMarker(row).hidden = !unavailable;', "availability marker visibility"],
  ['Unavailable shortcuts are marked below.', "generic unavailable shortcut guidance"],
  ['busy controls temporarily reject shortcuts.', "generic busy shortcut guidance"],
  ['shortcutPresentationObserver?.disconnect()', "shortcut presentation observer teardown"],
  ['Protection is disabled for this site until you turn it back on.', "persistent site-disable explanation"],
  ['Protection is paused for this browser session only.', "session-pause explanation"],
  ['pauseSite.setAttribute("aria-pressed", paused ? "true" : "false")', "session pause pressed state"]
]) requireText(semantics, needle, label);
if (/popupShortcutControlAvailable|bindPopupShortcutControls|POPUP_SHORTCUTS/.test(semantics)) {
  throw new Error("popup semantics must not recompute shortcut routing/actionability");
}

for (const [needle, label] of [
  ['import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";', "keyboard shortcut catalog import"],
  ['import { bindPopupShortcutControls } from "./shortcut-bindings.js";', "keyboard shortcut binding import"],
  ['import { bindPopupShortcutHelp } from "./shortcut-help-contract.js";', "keyboard shortcut-help contract import"],
  ['import { popupShortcutControlAvailable } from "./shortcut-availability.js";', "keyboard shared availability import"],
  ['const shortcutDefinitions = POPUP_SHORTCUTS;', "canonical shortcut inventory"],
  ['const shortcutControls = bindPopupShortcutControls(document, shortcutDefinitions);', "bound shortcut controls"],
  ['const shortcutHelpItems = bindPopupShortcutHelp(shortcutHelp);', "bound shortcut-help rows"],
  ['return popupShortcutControlAvailable(control, { pageActive, popupMain });', "keyboard shared actionability boundary"],
  ['if (!actionable(control)) return false;', "unavailable shortcut no-consume guard"],
  ['event.preventDefault();\n  control.click();', "shortcut delegation to existing control path"],
  ['function syncShortcutHelpAvailability()', "shortcut help availability refresh"],
  ['item.hidden = false;', "shortcut help remains discoverable"],
  ['item.setAttribute("aria-disabled", "true");', "keyboard availability semantics"],
  ['function toggleShortcutHelp(event)', "shortcut help toggle"],
  ['function closeShortcutHelp(event)', "shortcut help close"],
  ['if (rawKey === "Escape" && shortcutHelp?.open)', "shortcut help Escape route"],
  ['if (rawKey === "?")', "shortcut help question-mark route"],
  ['if (!shortcutCatalogReady || !pageActive || event.defaultPrevented || event.repeat || event.isComposing) return;', "keyboard lifecycle/catalog/repeat/composition guard"],
  ['if (event.ctrlKey || event.metaKey || event.altKey) return;', "keyboard modifier guard"],
  ['if (textEntryTarget(event.target)) return;', "keyboard text-entry guard"],
  ['shortcutAvailabilityObserver?.disconnect()', "keyboard availability observer teardown"],
  ['window.removeEventListener("keydown", handlePopupShortcut)', "keyboard listener teardown"]
]) requireText(keyboard, needle, label);

for (const [source, needle, label] of [
  [catalog, 'export const POPUP_SHORTCUTS = Object.freeze(', "frozen shortcut catalog"],
  [bindings, 'const MAX_POPUP_SHORTCUTS = 16;', "bounded shortcut binding catalog"],
  [bindings, 'return Object.freeze(controls);', "frozen shortcut control bindings"],
  [helpContract, 'return Object.freeze(ordered);', "frozen shortcut-help bindings"]
]) requireText(source, needle, label);

for (const [needle, label] of [
  ['!pageActive', "inactive-page shortcut rejection"],
  ['!control?.isConnected', "disconnected shortcut rejection"],
  ['control.disabled', "disabled shortcut rejection"],
  ['control.hidden === true', "direct hidden shortcut rejection"],
  ['popupMain?.getAttribute?.("aria-busy") === "true"', "popup-wide busy shortcut rejection"],
  ['control.getAttribute?.("aria-busy") === "true"', "control busy shortcut rejection"],
  ['control.closest?.("[hidden]")', "hidden-ancestor shortcut rejection"],
  ['control.closest?.(\'[aria-busy="true"]\')', "busy-ancestor shortcut rejection"]
]) requireText(availability, needle, label);

for (const [pattern, label] of [
  [/\.shortcut-help summary \{[^}]*min-height: 44px;/s, "shortcut help target size"],
  [/kbd \{[^}]*border: 1px solid currentColor;/s, "shortcut keycap presentation"],
  [/\.shortcut-list li\[aria-disabled="true"\] \{ opacity: \.55; \}/, "unavailable shortcut presentation"],
  [/\.shortcut-availability \{[^}]*font-size: 13px;/s, "availability marker presentation"],
  [/@media \(prefers-contrast: more\)[\s\S]*\.shortcut-list li\[aria-disabled="true"\][^}]*opacity: 1/, "shortcut increased-contrast restoration"],
  [/@media \(forced-colors: active\)[\s\S]*\.shortcut-list li\[aria-disabled="true"\][^}]*opacity: 1/, "shortcut forced-colors restoration"],
  [/@media \(max-width: 360px\)[\s\S]*\.shortcut-list li/, "shortcut narrow-width reflow"]
]) requireMatch(css, pattern, label);

for (const [needle, label] of [
  ['let pageActive = true;', "primary popup active-page lifecycle"],
  ['pageActive = false;\n  renderQueued = false;\n  committedRenderGeneration += 1;', "pagehide render invalidation"],
  ['globalStatusRevision += 1;\n  siteStatusRevision += 1;', "pagehide status invalidation"],
  ['pendingMutations = 0;\n  pendingSiteMutations = 0;', "pagehide busy-state invalidation"],
  ['try { disposeStorageLiveSync?.(); } catch', "popup live-sync teardown ownership"],
  ['if (!pageActive || generation !== committedRenderGeneration) return false;', "async committed-render publication guard"],
  ['if (!pageActive || revision !== siteStatusRevision) return false;', "site-status revision lifecycle guard"],
  ['function isSiteBusyControl(control)', "site busy ownership classifier"],
  ['siteSection?.setAttribute("aria-busy", "true")', "site busy publication"],
  ['else siteSection.removeAttribute("aria-busy")', "site busy cleanup"]
]) requireText(popup, needle, label);

const pagehide = popup.indexOf('window.addEventListener("pagehide"');
const initialAwait = popup.indexOf("initialSnapshot = await getSnapshot()");
if (pagehide < 0 || initialAwait < 0 || pagehide >= initialAwait) {
  throw new Error("popup pagehide lifecycle must be installed before top-level async initialization");
}

for (const source of [semantics, keyboard, availability, catalog, bindings, helpContract]) {
  if (/localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(source)) {
    throw new Error("popup presentation/keyboard semantics must remain local and non-persistent");
  }
}

// Popup semantics/privacy/keyboard behavior is verified directly from current source.
// Historical milestone test-file presence is intentionally not part of this audit.

console.log("popup-semantics-audit: popup semantics/privacy/keyboard invariants verified through M867");
