import { ACTION_COUNT_PREFERENCE_KEY, loadActionCountEnabled, setActionCountEnabled, supportsActionCount } from "../core/action-count.js";
import { isRelevantOptionsStorageChange, optionsCaughtErrorMessage } from "../core/options-boundary.js";
import { installOwnedOptionsStorageListener } from "../core/options-storage-listener.js";

const api = globalThis.browser ?? globalThis.chrome;
const main = document.querySelector("main");
const countrySection = document.querySelector("#country-settings");

if (main) {
  const section = document.createElement("section");
  section.id = "action-count-settings";

  const heading = document.createElement("h2");
  heading.textContent = "Protection action count";

  const label = document.createElement("label");
  label.className = "check-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "action-count-badge";
  const labelText = document.createElement("span");
  labelText.textContent = "Show the current tab's browser-owned protection action count on the toolbar badge";
  label.append(checkbox, labelText);

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = "The browser maintains this per-tab aggregate. Drop Ads does not receive or store individual matched requests to calculate it. Cookie/header protection can also count as an action, so this is intentionally labeled Protection actions rather than Ads blocked.";

  const status = document.createElement("p");
  status.className = "hint";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  section.append(heading, label, hint, status);
  if (countrySection?.parentNode === main) countrySection.insertAdjacentElement("afterend", section);
  else main.append(section);

  const supported = supportsActionCount(api);
  let internalMutationDepth = 0;
  let committedRefreshGeneration = 0;
  let pageActive = true;
  let disposeStorageLiveSync = null;

  window.addEventListener("pagehide", () => {
    pageActive = false;
    committedRefreshGeneration += 1;
    try { disposeStorageLiveSync?.(); } catch { /* Best-effort page teardown. */ }
    disposeStorageLiveSync = null;
  }, { once: true });

  checkbox.checked = true;
  let initialLoadError = null;
  try {
    const initialEnabled = await loadActionCountEnabled(api);
    if (pageActive) checkbox.checked = initialEnabled;
  } catch (error) {
    if (pageActive) initialLoadError = error;
  }
  if (pageActive) checkbox.disabled = !supported;
  if (pageActive && !supported) {
    status.textContent = "This browser does not expose the declarative protection-action badge API; blocking remains fully active.";
  } else if (pageActive && initialLoadError) {
    status.textContent = optionsCaughtErrorMessage(initialLoadError, "Could not read the saved count-display preference");
  }

  async function refreshFromCommittedPreference() {
    if (!pageActive) return false;
    const generation = ++committedRefreshGeneration;
    try {
      const enabled = await loadActionCountEnabled(api);
      if (!pageActive || generation !== committedRefreshGeneration || internalMutationDepth !== 0) return false;
      checkbox.checked = enabled;
      return true;
    } catch (error) {
      if (pageActive && generation === committedRefreshGeneration && internalMutationDepth === 0) {
        status.textContent = optionsCaughtErrorMessage(error, "Could not refresh the saved count-display preference");
      }
      return false;
    }
  }

  function installStorageLiveSync() {
    if (!pageActive) return false;
    try {
      disposeStorageLiveSync = installOwnedOptionsStorageListener(api, (changes, areaName) => {
        if (!pageActive || internalMutationDepth !== 0) return;
        if (!isRelevantOptionsStorageChange(changes, areaName, ACTION_COUNT_PREFERENCE_KEY)) return;
        void refreshFromCommittedPreference();
      });
      return true;
    } catch {
      disposeStorageLiveSync = null;
      if (pageActive && supported) {
        status.textContent = optionsCaughtErrorMessage(null, "Automatic count-display synchronization is unavailable; direct changes still work.");
      }
      return false;
    }
  }

  installStorageLiveSync();

  checkbox.addEventListener("change", async () => {
    if (!pageActive) return;
    const desired = checkbox.checked;
    checkbox.disabled = true;
    section.setAttribute("aria-busy", "true");
    status.textContent = desired ? "Enabling count…" : "Hiding count…";
    internalMutationDepth += 1;
    committedRefreshGeneration += 1;
    try {
      const result = await setActionCountEnabled(api, desired);
      if (!pageActive) return;
      status.textContent = result.supported
        ? (desired ? "Per-tab protection action count enabled." : "Protection action count hidden; blocking is unchanged.")
        : "Count display is not supported by this browser; blocking is unchanged.";
    } catch (error) {
      if (!pageActive) return;
      const failureMessage = optionsCaughtErrorMessage(error, "Could not change count display");
      try {
        const restored = await loadActionCountEnabled(api);
        if (pageActive) checkbox.checked = restored;
      } catch {
        if (pageActive) checkbox.checked = !desired;
      }
      if (pageActive) status.textContent = failureMessage;
    } finally {
      internalMutationDepth -= 1;
      if (pageActive) {
        section.removeAttribute("aria-busy");
        checkbox.disabled = !supported;
      }
    }
  });
}
