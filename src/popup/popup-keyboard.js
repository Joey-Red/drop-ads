import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";
import { bindPopupShortcutControls } from "./shortcut-bindings.js";
import { bindPopupShortcutHelp } from "./shortcut-help-contract.js";
import { popupShortcutControlAvailable } from "./shortcut-availability.js";

const popupMain = document.querySelector("#popup-main");
const shortcutHelp = document.querySelector("#shortcut-help");
const shortcutHelpSummary = document.querySelector("#shortcut-help-summary");
let pageActive = true;
let shortcutAvailabilityObserver = null;

const shortcutDefinitions = POPUP_SHORTCUTS;
const shortcutControls = bindPopupShortcutControls(document, shortcutDefinitions);
const shortcutHelpItems = bindPopupShortcutHelp(shortcutHelp);
const shortcutCatalogReady = Boolean(shortcutHelpItems);

function shortcutDefinition(key) {
  return shortcutDefinitions.find((definition) => definition.key === key) ?? null;
}

function textEntryTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest("[contenteditable=\"true\"]")) return true;
  if (target.matches("textarea, select")) return true;
  if (!target.matches("input")) return false;
  const type = (target.getAttribute("type") || "text").toLowerCase();
  return !["checkbox", "radio", "button", "submit", "reset"].includes(type);
}

function structurallyAvailable(control) {
  return Boolean(pageActive && control?.isConnected && control.hidden !== true && !control.closest("[hidden]"));
}

function actionable(control) {
  return popupShortcutControlAvailable(control, { pageActive, popupMain });
}

function activate(control, event) {
  if (!actionable(control)) return false;
  event.preventDefault();
  control.click();
  return true;
}

function shortcutControlForHelpItem(item) {
  if (!shortcutCatalogReady) return null;
  const definition = shortcutDefinition(item?.dataset?.shortcut ?? "");
  if (!definition) return null;
  if (item?.dataset?.shortcutControl !== definition.controlId) return null;
  const control = shortcutControls[definition.key];
  if (!control || control.id !== definition.controlId) return null;
  return control;
}

function syncShortcutHelpAvailability() {
  if (!shortcutCatalogReady) return 0;
  let availableCount = 0;
  for (const item of shortcutHelpItems) {
    const control = shortcutControlForHelpItem(item);
    item.hidden = false;
    const available = actionable(control);
    if (available) {
      item.removeAttribute("aria-disabled");
      availableCount += 1;
    } else {
      item.setAttribute("aria-disabled", "true");
    }
  }
  return availableCount;
}

function syncShortcutDisclosureMetadata() {
  if (!shortcutHelpSummary) return;
  shortcutHelpSummary.setAttribute("aria-keyshortcuts", shortcutHelp?.open ? "? Escape" : "?");
}

function handleShortcutHelpToggle() {
  if (!pageActive) return;
  syncShortcutHelpAvailability();
  syncShortcutDisclosureMetadata();
}

function toggleShortcutHelp(event) {
  if (!shortcutCatalogReady || !pageActive || !shortcutHelp?.isConnected || !shortcutHelpSummary?.isConnected) return false;
  event.preventDefault();
  const opening = !shortcutHelp.open;
  shortcutHelp.open = opening;
  syncShortcutDisclosureMetadata();
  if (opening) {
    syncShortcutHelpAvailability();
    shortcutHelpSummary.focus();
  }
  return true;
}

function closeShortcutHelp(event) {
  if (!shortcutCatalogReady || !pageActive || !shortcutHelp?.isConnected || !shortcutHelpSummary?.isConnected || !shortcutHelp.open) return false;
  event.preventDefault();
  shortcutHelp.open = false;
  syncShortcutDisclosureMetadata();
  shortcutHelpSummary.focus();
  return true;
}

function handlePopupShortcut(event) {
  if (!shortcutCatalogReady || !pageActive || event.defaultPrevented || event.repeat || event.isComposing) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (textEntryTarget(event.target)) return;
  const rawKey = String(event.key || "");
  if (rawKey === "Escape" && shortcutHelp?.open) {
    closeShortcutHelp(event);
    return;
  }
  if (rawKey === "?") {
    toggleShortcutHelp(event);
    return;
  }
  if (event.shiftKey) return;
  const control = shortcutControls[rawKey.toLowerCase()];
  if (control) activate(control, event);
}

syncShortcutHelpAvailability();
syncShortcutDisclosureMetadata();
shortcutHelp?.addEventListener("toggle", handleShortcutHelpToggle);
if (popupMain && typeof globalThis.MutationObserver === "function") {
  shortcutAvailabilityObserver = new globalThis.MutationObserver((mutations) => {
    if (!pageActive) return;
    if (mutations.every((mutation) => mutation.target?.closest?.("#shortcut-help-list"))) return;
    syncShortcutHelpAvailability();
  });
  shortcutAvailabilityObserver.observe(popupMain, {
    attributes: true,
    subtree: true,
    attributeFilter: ["hidden", "disabled", "aria-busy"]
  });
}
window.addEventListener("keydown", handlePopupShortcut);
window.addEventListener("pagehide", () => {
  pageActive = false;
  try { shortcutAvailabilityObserver?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  shortcutAvailabilityObserver = null;
  shortcutHelp?.removeEventListener("toggle", handleShortcutHelpToggle);
  window.removeEventListener("keydown", handlePopupShortcut);
}, { once: true });

export {
  actionable,
  activate,
  closeShortcutHelp,
  handlePopupShortcut,
  handleShortcutHelpToggle,
  shortcutCatalogReady,
  shortcutControlForHelpItem,
  shortcutControls,
  shortcutDefinition,
  shortcutDefinitions,
  structurallyAvailable,
  syncShortcutDisclosureMetadata,
  syncShortcutHelpAvailability,
  textEntryTarget,
  toggleShortcutHelp
};
