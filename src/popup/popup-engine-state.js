import { isManagedRuleId } from "../core/rules.js";
import { STORAGE_KEY } from "../core/storage.js";

const api = globalThis.browser ?? globalThis.chrome;
const status = document.querySelector("#engine-status");
const enabledControl = document.querySelector("#enabled");

let active = true;
let generation = 0;
let refreshTimer = null;

function scheduleRefresh(delay = 0) {
  if (!active) return;
  if (refreshTimer != null) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshEngineState();
  }, delay);
}

async function refreshEngineState() {
  if (!active || !status) return;
  const currentGeneration = ++generation;
  try {
    const [stored, rules] = await Promise.all([
      api.storage.local.get(STORAGE_KEY),
      api.declarativeNetRequest.getDynamicRules()
    ]);
    if (!active || currentGeneration !== generation) return;
    const state = stored?.[STORAGE_KEY];
    const managedLoaded = Array.isArray(rules) && rules.some((rule) => Number.isSafeInteger(rule?.id) && isManagedRuleId(rule.id));

    if (!state || typeof state.enabled !== "boolean") {
      status.textContent = managedLoaded
        ? "Drop Ads network engine is initializing; managed rules are already loaded."
        : "Drop Ads network engine is initializing.";
      status.dataset.engineState = "initializing";
      return;
    }

    const configuredEnabled = state.enabled;
    // This module runs before the awaited popup bootstrap. Reflect the durable
    // preference immediately so a slow/waking background never presents the
    // bare HTML checkbox default as an authoritative OFF state. popup.js keeps
    // the control disabled until its committed runtime snapshot is available.
    if (enabledControl) enabledControl.checked = configuredEnabled;
    if (!configuredEnabled && managedLoaded) {
      status.textContent = "Drop Ads network engine mismatch: the master switch is off, but Drop Ads rules are still loaded.";
      status.dataset.engineState = "mismatch";
      return;
    }
    if (!configuredEnabled) {
      status.textContent = "Drop Ads network engine: off.";
      status.dataset.engineState = "off";
      return;
    }
    if (managedLoaded) {
      status.textContent = "Drop Ads network engine: on.";
      status.dataset.engineState = "on";
      return;
    }
    status.textContent = "Drop Ads network engine: on; no managed network rules are loaded yet.";
    status.dataset.engineState = "pending";
  } catch {
    if (!active || currentGeneration !== generation) return;
    status.textContent = "Drop Ads network engine state is temporarily unavailable.";
    status.dataset.engineState = "unknown";
  }
}

function handleStorageChange(changes, areaName) {
  if (areaName !== "local" || !Object.hasOwn(changes ?? {}, STORAGE_KEY)) return;
  scheduleRefresh();
}

function handleVisibility() {
  if (document.visibilityState === "visible") scheduleRefresh();
}

api.storage.onChanged.addListener(handleStorageChange);
enabledControl?.addEventListener("change", () => {
  scheduleRefresh(0);
  setTimeout(() => scheduleRefresh(), 500);
  setTimeout(() => scheduleRefresh(), 1500);
});
window.addEventListener("focus", () => scheduleRefresh());
document.addEventListener("visibilitychange", handleVisibility);
void refreshEngineState();

window.addEventListener("pagehide", () => {
  active = false;
  generation += 1;
  if (refreshTimer != null) clearTimeout(refreshTimer);
  refreshTimer = null;
  try { api.storage.onChanged.removeListener(handleStorageChange); } catch { /* Best-effort popup teardown. */ }
  document.removeEventListener("visibilitychange", handleVisibility);
}, { once: true });
