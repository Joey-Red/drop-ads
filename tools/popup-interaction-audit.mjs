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

const popup = read("src/popup/popup.js");
const semantics = read("src/popup/popup-semantics.js");
const keyboard = read("src/popup/popup-keyboard.js");
const catalog = read("src/popup/shortcut-catalog.js");
const bindings = read("src/popup/shortcut-bindings.js");
const availability = read("src/popup/shortcut-availability.js");
const html = read("src/popup/index.html");
const css = read("src/popup/popup.css");

for (const [needle, label] of [
  ['<script type="module" src="popup-semantics.js"></script>', "popup semantics module"],
  ['<script type="module" src="popup-keyboard.js"></script>', "popup keyboard module"],
  ['aria-describedby="popup-privacy-note"', "popup privacy boundary association"],
  ['id="pause-site" type="button"', "session pause action"],
  ['id="session-status" class="session-status" role="status"', "session live status"],
  ['<details id="shortcut-help" class="shortcut-help"', "shortcut help disclosure"],
  ['id="shortcut-help-summary" aria-keyshortcuts="?"', "shortcut help keyboard relationship"]
]) requireText(html, needle, label);

for (const [id, key] of [
  ["enabled", "G"],
  ["site-enabled", "S"],
  ["cookie-site-enabled", "C"],
  ["pause-site", "P"],
  ["pick-element", "E"],
  ["settings", "O"]
]) requireMatch(html, new RegExp(`id="${id}"[^>]*aria-keyshortcuts="${key}"`), `${id} keyboard relationship`);

for (const [needle, label] of [
  ['let pageActive = true', "popup active-page lifecycle"],
  ['committedRenderGeneration += 1', "render invalidation on teardown"],
  ['if (!pageActive || generation !== committedRenderGeneration) return false', "stale committed-render rejection"],
  ['if (!pageActive || renderQueued) return', "post-teardown queue rejection"],
  ['const releaseBusy = beginPopupBusy(settings)', "Settings exact-control busy state"],
  ['publishGlobalStatus("Opening Settings…")', "Settings launch feedback"],
  ['await Promise.resolve(openPopupOptionsPage(api))', "Settings launch await"],
  ['const releaseBusy = beginPopupBusy(pickElement)', "picker exact-control busy state"],
  ['publishSiteStatus("Starting element picker…")', "picker launch feedback"],
  ['await sendPopupTopFrameMessage(api, currentTabId, { type: "drop-ads:start-element-picker" })', "top-frame picker start"],
  ['if (pageActive && pickElement.isConnected) pickElement.disabled = false', "picker retry recovery"]
]) requireText(popup, needle, label);

for (const [needle, label] of [
  ['let lastDerivedStatus = ""', "derived status identity"],
  ['function releaseDerivedStatusOwnership()', "explicit status ownership release"],
  ['if (current === lastDerivedStatus) return', "derived text equality guard"],
  ['sessionStatusObserver?.disconnect()', "session-status observer teardown"],
  ['siteEnabled?.setAttribute("aria-label", `Protection on ${site}`)', "site protection accessible name"],
  ['cookieSiteEnabled?.setAttribute("aria-label", `Cookie protection on ${site}`)', "cookie protection accessible name"],
  ['pauseSite.setAttribute("aria-pressed", paused ? "true" : "false")', "session pause pressed state"],
  ['Cookie protection is disabled for this site by a local exception.', "cookie exception idle guidance"],
  ['function syncShortcutPresentation()', "shortcut presentation owner"],
  ['row.getAttribute("aria-disabled") === "true"', "shortcut presentation availability state"],
  ['shortcutAvailabilityMarker(row).hidden = !unavailable', "shortcut unavailable marker"],
  ['shortcutPresentationObserver?.disconnect()', "shortcut presentation teardown"],
  ['siteLabelObserver?.disconnect()', "site label observer teardown"],
  ['pauseObserver?.disconnect()', "pause observer teardown"]
]) requireText(semantics, needle, label);
if (/popupShortcutControlAvailable|bindPopupShortcutControls|POPUP_SHORTCUTS/.test(semantics)) throw new Error("popup semantics must consume shortcut availability state, not recompute actionability");

for (const [needle, label] of [
  ['import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";', "shortcut catalog import"],
  ['import { bindPopupShortcutControls } from "./shortcut-bindings.js";', "shortcut binding import"],
  ['import { popupShortcutControlAvailable } from "./shortcut-availability.js";', "shared shortcut actionability boundary"],
  ['const shortcutDefinitions = POPUP_SHORTCUTS;', "reviewed shortcut definitions"],
  ['const shortcutControls = bindPopupShortcutControls(document, shortcutDefinitions);', "native-control shortcut binding"],
  ['function textEntryTarget(target)', "text-entry shortcut guard"],
  ['event.defaultPrevented || event.repeat || event.isComposing', "repeat/composition guard"],
  ['event.ctrlKey || event.metaKey || event.altKey', "modifier guard"],
  ['if (event.shiftKey) return;', "shifted-letter guard"],
  ['if (textEntryTarget(event.target)) return;', "text-entry suppression"],
  ['if (rawKey === "?")', "shortcut-help toggle"],
  ['if (rawKey === "Escape" && shortcutHelp?.open)', "shortcut-help Escape recovery"],
  ['shortcutHelpSummary.focus()', "shortcut-help focus recovery"],
  ['function shortcutControlForHelpItem(item)', "exact help target resolver"],
  ['item?.dataset?.shortcutControl !== definition.controlId', "help/control identity guard"],
  ['control.id !== definition.controlId', "resolved-control identity guard"],
  ['const available = actionable(control);', "help/action routing parity"],
  ['item.hidden = false;', "unavailable shortcut discoverability"],
  ['function syncShortcutDisclosureMetadata()', "shortcut disclosure metadata"],
  ['attributeFilter: ["hidden", "disabled", "aria-busy"]', "bounded help availability observation"],
  ['shortcutAvailabilityObserver?.disconnect()', "shortcut availability teardown"],
  ['window.removeEventListener("keydown", handlePopupShortcut)', "keyboard listener teardown"]
]) requireText(keyboard, needle, label);
if (/item\.hidden\s*=\s*true/.test(keyboard)) throw new Error("popup shortcut help must not hide unavailable commands");

requireText(catalog, 'export const POPUP_SHORTCUTS = Object.freeze(', "frozen shortcut catalog");
requireText(bindings, 'return Object.freeze(controls);', "frozen shortcut bindings");
for (const [needle, label] of [
  ['!pageActive || !control?.isConnected || control.disabled || control.hidden === true', "shortcut structural actionability"],
  ['popupMain?.getAttribute?.("aria-busy") === "true"', "popup busy actionability guard"],
  ['control.getAttribute?.("aria-busy") === "true"', "control busy actionability guard"],
  ['control.closest?.("[hidden]")', "hidden ancestor actionability guard"],
  ['control.closest?.(\'[aria-busy="true"]\')', "busy ancestor actionability guard"]
]) requireText(availability, needle, label);

for (const [pattern, label] of [
  [/\.shortcut-help summary \{[^}]*min-height: 44px;/s, "shortcut-help target floor"],
  [/@media \(max-width: 360px\)[\s\S]*\.shortcut-list li/, "shortcut-help narrow reflow"],
  [/@media \(prefers-contrast: more\)[\s\S]*\.shortcut-help/, "shortcut-help increased contrast"],
  [/@media \(forced-colors: active\)[\s\S]*\.shortcut-help summary:focus-visible/, "shortcut-help forced-colors focus"],
  [/@media \(prefers-reduced-motion: reduce\)/, "popup reduced-motion parity"]
]) requireMatch(css, pattern, label);

const precedence = [
  "Protection is disabled for this site until you turn it back on.",
  "Protection is paused for this browser session only.",
  "Global blocking is off; this site's saved protection settings remain local",
  "Cookie protection is disabled for this site by a local exception."
].map((text) => semantics.indexOf(text));
if (precedence.some((index) => index < 0) || precedence.some((index, position) => position > 0 && index <= precedence[position - 1])) {
  throw new Error("popup derived-status precedence is missing or out of order");
}

for (const source of [popup, semantics, keyboard, availability, catalog, bindings]) {
  if (/localStorage|sessionStorage|indexedDB|declarativeNetRequestFeedback|webRequest|analytics|telemetry/.test(source)) {
    throw new Error("popup interaction surface must not introduce retained activity/history APIs");
  }
}
requireMatch(popup, /pagehide/, "popup lifecycle teardown");
requireMatch(keyboard, /pagehide/, "popup keyboard teardown");

// Current popup interaction behavior is validated directly above. Historical
// milestone test-file presence is intentionally not part of this gate.

console.log("popup-interaction-audit: popup interaction and keyboard invariants verified through M867");
