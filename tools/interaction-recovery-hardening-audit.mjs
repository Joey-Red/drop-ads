import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

const popupHtml = read("src/popup/index.html");
const popupKeyboard = read("src/popup/popup-keyboard.js");
const popupCatalog = read("src/popup/shortcut-catalog.js");
const popupBindings = read("src/popup/shortcut-bindings.js");
const popupAvailability = read("src/popup/shortcut-availability.js");
const sessionRecovery = read("src/options/session-pauses.js");
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ['id="shortcut-help" class="shortcut-help"', "popup shortcut help disclosure"],
  ['id="shortcut-help-summary" aria-keyshortcuts="?"', "popup shortcut help key metadata"],
  ['id="enabled" type="checkbox" aria-label="Global blocking" aria-keyshortcuts="G"', "global blocking shortcut metadata"],
  ['id="site-enabled" type="checkbox" aria-keyshortcuts="S"', "site protection shortcut metadata"],
  ['id="cookie-site-enabled" type="checkbox" aria-keyshortcuts="C"', "cookie shortcut metadata"],
  ['id="pause-site" type="button" aria-keyshortcuts="P"', "session pause shortcut metadata"],
  ['id="pick-element" type="button" aria-keyshortcuts="E"', "picker shortcut metadata"],
  ['id="settings" type="button" aria-keyshortcuts="O"', "Settings shortcut metadata"],
  ['<script type="module" src="popup-keyboard.js"></script>', "popup keyboard module load"]
]) requireText(popupHtml, needle, label);

for (const [needle, label] of [
  ['import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";', "shared popup shortcut catalog"],
  ['import { bindPopupShortcutControls } from "./shortcut-bindings.js";', "shared popup shortcut bindings"],
  ['import { popupShortcutControlAvailable } from "./shortcut-availability.js";', "shared popup shortcut availability"],
  ['const shortcutControls = bindPopupShortcutControls(document, shortcutDefinitions);', "bound popup shortcut routing"],
  ['return popupShortcutControlAvailable(control, { pageActive, popupMain });', "central popup shortcut actionability"],
  ['if (rawKey === "Escape" && shortcutHelp?.open)', "shortcut-help Escape recovery"],
  ['if (rawKey === "?")', "shortcut-help keyboard toggle"],
  ['if (event.shiftKey) return;', "shifted-letter shortcut rejection"],
  ['if (textEntryTarget(event.target)) return;', "text-entry shortcut suppression"],
  ['window.removeEventListener("keydown", handlePopupShortcut)', "popup shortcut teardown"]
]) requireText(popupKeyboard, needle, label);

for (const [source, needle, label] of [
  [popupCatalog, 'export const POPUP_SHORTCUTS = Object.freeze(', "frozen popup shortcut inventory"],
  [popupBindings, 'const MAX_POPUP_SHORTCUTS = 16;', "bounded popup shortcut routing"],
  [popupAvailability, 'control.closest?.("[hidden]")', "hidden-ancestor actionability guard"],
  [popupAvailability, 'popupMain?.getAttribute?.("aria-busy") === "true"', "popup busy actionability guard"]
]) requireText(source, needle, label);

for (const [needle, label] of [
  ['settingsNav?.querySelector(\'a[href="#session-pauses-settings"]\')', "idempotent session navigation creation"],
  ['document.querySelector("#session-pauses-settings")', "idempotent session section creation"],
  ['type: "drop-ads:set-session-site-paused"', "runtime-mediated session recovery"],
  ['function restoreResumeFocus(rowIndex)', "session recovery focus restoration"],
  ['Object.getOwnPropertyDescriptor(changes, SESSION_STORAGE_KEY)', "descriptor-safe session live sync"],
  ['if (areaName !== "session" || !hasSessionStateChange(changes)) return;', "session-area live-sync boundary"],
  ['if (!pageActive || internalMutationDepth > 0) return;', "self-mutation live-sync suppression"],
  ['disposeStorageSync?.()', "session listener teardown"]
]) requireText(sessionRecovery, needle, label);

for (const forbidden of ["localStorage", "sessionStorage", "indexedDB", "sendBeacon", "declarativeNetRequestFeedback", "webRequest"]) {
  if (popupKeyboard.includes(forbidden) || popupCatalog.includes(forbidden) || popupBindings.includes(forbidden)
    || popupAvailability.includes(forbidden) || sessionRecovery.includes(forbidden)) {
    throw new Error(`interaction/recovery surface contains forbidden retained-activity API: ${forbidden}`);
  }
}

if (packageJson.scripts?.["interaction-recovery-hardening-audit"] !== "node tools/interaction-recovery-hardening-audit.mjs") {
  throw new Error("interaction-recovery-hardening-audit package script is missing");
}
if (!packageJson.scripts?.check?.includes("npm run interaction-recovery-hardening-audit")) {
  throw new Error("interaction-recovery-hardening-audit is not wired into npm run check");
}

// Current interaction/recovery ownership is validated directly above. Historical
// milestone test filenames are intentionally not required by this audit.

console.log("interaction-recovery-hardening-audit: reconciled M849-M856 invariants verified");
