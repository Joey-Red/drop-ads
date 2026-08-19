import { installPopupStorageListener, openPopupOptionsPage, popupCaughtErrorMessage, popupStorageChangeAffectsPolicy, queryPopupActiveTab, sendPopupRuntimeMessage, sendPopupTopFrameMessage, snapshotPopupActiveTab, snapshotPopupUiState, unwrapPopupRuntimeResponse } from "../core/popup-boundary.js";
import { setCookieBannerSiteDisabled } from "../core/cookie-banner-site-policy.js";
import { normalizeDomain } from "../core/rules.js";
import { SESSION_STORAGE_KEY } from "../core/session.js";
import { STORAGE_KEY } from "../core/storage.js";

const api = globalThis.browser ?? globalThis.chrome;
const popupMain = document.querySelector("#popup-main");
const enabled = document.querySelector("#enabled");
const globalStatus = document.querySelector("#global-status");
const siteUnavailable = document.querySelector("#site-unavailable");
const siteSection = document.querySelector("#site-section");
const siteName = document.querySelector("#site-name");
const siteEnabled = document.querySelector("#site-enabled");
const cookieSiteRow = document.querySelector("#cookie-site-row");
const cookieSiteEnabled = document.querySelector("#cookie-site-enabled");
const cookieBannerSiteRow = document.querySelector("#cookie-banner-site-row");
const cookieBannerSiteEnabled = document.querySelector("#cookie-banner-site-enabled");
const pauseSite = document.querySelector("#pause-site");
const pickElement = document.querySelector("#pick-element");
const sessionStatus = document.querySelector("#session-status");
const settings = document.querySelector("#settings");

let currentSite = null;
let currentTabId = null;
let sessionPaused = false;
let renderQueued = false;
let committedRenderGeneration = 0;
let globalStatusRevision = 0;
let siteStatusRevision = 0;
let pendingMutations = 0;
let pendingSiteMutations = 0;
let disposeStorageLiveSync = null;
let pageActive = true;

window.addEventListener("pagehide", () => {
  pageActive = false;
  renderQueued = false;
  committedRenderGeneration += 1;
  globalStatusRevision += 1;
  siteStatusRevision += 1;
  pendingMutations = 0;
  pendingSiteMutations = 0;
  try { disposeStorageLiveSync?.(); } catch { /* Best-effort popup teardown. */ }
  disposeStorageLiveSync = null;
}, { once: true });

function isSiteBusyControl(control) {
  return control === siteEnabled || control === cookieSiteEnabled || control === cookieBannerSiteEnabled || control === pauseSite || control === pickElement;
}

function beginPopupBusy(control = null) {
  if (!pageActive) return () => undefined;
  const siteScoped = isSiteBusyControl(control);
  pendingMutations += 1;
  popupMain.setAttribute("aria-busy", "true");
  if (siteScoped) {
    pendingSiteMutations += 1;
    siteSection?.setAttribute("aria-busy", "true");
  }
  if (control) control.setAttribute("aria-busy", "true");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (!pageActive) return;
    pendingMutations = Math.max(0, pendingMutations - 1);
    popupMain.setAttribute("aria-busy", pendingMutations > 0 ? "true" : "false");
    if (siteScoped) {
      pendingSiteMutations = Math.max(0, pendingSiteMutations - 1);
      if (siteSection?.isConnected) {
        if (pendingSiteMutations > 0) siteSection.setAttribute("aria-busy", "true");
        else siteSection.removeAttribute("aria-busy");
      }
    }
    if (control?.isConnected) control.removeAttribute("aria-busy");
  };
}

function publishGlobalStatus(text) {
  globalStatusRevision += 1;
  if (pageActive) globalStatus.textContent = text;
  return globalStatusRevision;
}

function clearGlobalStatus(revision = null) {
  if (!pageActive) return;
  if (revision != null && revision !== globalStatusRevision) return;
  globalStatusRevision += 1;
  globalStatus.textContent = "";
}

function publishSiteStatus(text) {
  siteStatusRevision += 1;
  if (pageActive) sessionStatus.textContent = text;
  return siteStatusRevision;
}

function publishCommittedSiteStatus(text, revision) {
  if (!pageActive || revision !== siteStatusRevision) return false;
  sessionStatus.textContent = text;
  return true;
}

async function runtimePolicy(message, fallback) {
  const response = await sendPopupRuntimeMessage(api, message);
  return unwrapPopupRuntimeResponse(response, fallback);
}

async function getSnapshot() {
  return snapshotPopupUiState(await runtimePolicy({ type: "drop-ads:get-ui-state" }, "Could not read current protection state"));
}

function renderGlobal(snapshot) {
  if (!pageActive) return false;
  enabled.checked = snapshot.state.enabled;
  enabled.disabled = false;
  return true;
}

function renderSiteControls(snapshot, statusRevision = siteStatusRevision) {
  if (!pageActive || !currentSite) return false;
  const { state, session } = snapshot;
  const persistentDisabled = state.disabledSites.includes(currentSite);
  sessionPaused = session.disabledSites.includes(currentSite);

  siteEnabled.checked = !persistentDisabled;
  pauseSite.disabled = persistentDisabled;
  pauseSite.textContent = sessionPaused ? "Resume this session" : "Pause until browser restart";
  pickElement.disabled = !state.enabled || persistentDisabled || sessionPaused || !Number.isInteger(currentTabId);
  publishCommittedSiteStatus(sessionPaused ? "Protection is paused for this browser session only." : "", statusRevision);

  if (state.cookieMode !== "off") {
    cookieSiteEnabled.checked = !state.cookieAllowSites.includes(currentSite) && !persistentDisabled && !sessionPaused;
    cookieSiteEnabled.disabled = persistentDisabled || sessionPaused;
    cookieSiteRow.hidden = false;
  } else {
    cookieSiteRow.hidden = true;
  }

  if (state.cookieBannerMode === "reject") {
    cookieBannerSiteEnabled.checked = !state.cookieBannerDisabledSites.includes(currentSite);
    cookieBannerSiteEnabled.disabled = false;
    cookieBannerSiteRow.hidden = false;
  } else {
    cookieBannerSiteRow.hidden = true;
  }

  siteSection.hidden = false;
  return true;
}

async function renderCommittedState(statusRevision = siteStatusRevision) {
  if (!pageActive) return false;
  const generation = ++committedRenderGeneration;
  const snapshot = await getSnapshot();
  if (!pageActive || generation !== committedRenderGeneration) return false;
  renderGlobal(snapshot);
  renderSiteControls(snapshot, statusRevision);
  return true;
}

function runCommittedRender() {
  renderQueued = false;
  if (!pageActive) return;
  const revision = globalStatusRevision;
  const statusRevision = siteStatusRevision;
  void renderCommittedState(statusRevision)
    .then((published) => {
      if (pageActive && published) clearGlobalStatus(revision);
    })
    .catch((error) => {
      if (pageActive) publishGlobalStatus(popupCaughtErrorMessage(error, "Could not refresh popup state"));
    });
}

function queueCommittedRender() {
  if (!pageActive || renderQueued) return;
  renderQueued = true;
  try {
    queueMicrotask(runCommittedRender);
  } catch {
    runCommittedRender();
  }
}

let initialSnapshot = null;
try {
  initialSnapshot = await getSnapshot();
  if (pageActive) {
    renderGlobal(initialSnapshot);
    clearGlobalStatus();
  }
} catch (error) {
  if (pageActive) {
    enabled.disabled = true;
    publishGlobalStatus(popupCaughtErrorMessage(error, "Could not read current protection state"));
  }
}

try {
  const tab = snapshotPopupActiveTab(await queryPopupActiveTab(api));
  if (pageActive) {
    if (tab && /^https?:\/\//i.test(tab.url)) {
      currentTabId = tab.id;
      currentSite = normalizeDomain(tab.url);
      siteName.textContent = currentSite;
      siteUnavailable.hidden = true;
      if (initialSnapshot) renderSiteControls(initialSnapshot, siteStatusRevision);
    } else {
      siteSection.hidden = true;
      siteUnavailable.hidden = false;
    }
  }
} catch {
  if (pageActive) {
    siteSection.hidden = true;
    siteUnavailable.hidden = false;
  }
}

if (pageActive) {
  try {
    disposeStorageLiveSync = installPopupStorageListener(api, (changes, areaName) => {
      if (!pageActive) return;
      if (popupStorageChangeAffectsPolicy(changes, areaName, STORAGE_KEY, SESSION_STORAGE_KEY)) queueCommittedRender();
    });
  } catch (error) {
    publishGlobalStatus(popupCaughtErrorMessage(error, "Live popup updates are unavailable"));
  }
}

enabled.addEventListener("change", async () => {
  if (!pageActive) return;
  const releaseBusy = beginPopupBusy(enabled);
  const desired = enabled.checked;
  enabled.disabled = true;
  const revision = publishGlobalStatus("Applying protection change…");
  try {
    await runtimePolicy({ type: "drop-ads:set-enabled", enabled: desired }, "Could not change global protection");
    await renderCommittedState();
    clearGlobalStatus(revision);
  } catch (error) {
    try { await renderCommittedState(); } catch { if (pageActive) enabled.checked = !desired; }
    publishGlobalStatus(popupCaughtErrorMessage(error, "Could not change global protection"));
  } finally {
    if (pageActive && enabled.isConnected) enabled.disabled = false;
    releaseBusy();
  }
});

siteEnabled.addEventListener("change", async () => {
  if (!pageActive || !currentSite) return;
  const releaseBusy = beginPopupBusy(siteEnabled);
  const desiredEnabled = siteEnabled.checked;
  siteEnabled.disabled = true;
  const statusRevision = publishSiteStatus("Applying site protection…");
  try {
    await runtimePolicy({ type: "drop-ads:set-site-disabled", domain: currentSite, disabled: !desiredEnabled }, "Could not change site protection");
    if (sessionPaused) await runtimePolicy({ type: "drop-ads:set-session-site-paused", domain: currentSite, paused: false }, "Site protection changed, but the session pause could not be cleared");
    await renderCommittedState(statusRevision);
  } catch (error) {
    try { await renderCommittedState(statusRevision); } catch { /* Keep current visual state if snapshot also fails. */ }
    publishSiteStatus(popupCaughtErrorMessage(error, "Could not change site protection"));
  } finally {
    if (pageActive && siteEnabled.isConnected) siteEnabled.disabled = false;
    releaseBusy();
  }
});

pauseSite.addEventListener("click", async () => {
  if (!pageActive || !currentSite || pauseSite.disabled) return;
  const releaseBusy = beginPopupBusy(pauseSite);
  pauseSite.disabled = true;
  const statusRevision = publishSiteStatus(sessionPaused ? "Resuming protection…" : "Pausing protection…");
  try {
    await runtimePolicy({ type: "drop-ads:set-session-site-paused", domain: currentSite, paused: !sessionPaused }, "Could not change session pause");
    await renderCommittedState(statusRevision);
  } catch (error) {
    try { await renderCommittedState(statusRevision); }
    catch { if (pageActive && pauseSite.isConnected) pauseSite.disabled = false; }
    publishSiteStatus(popupCaughtErrorMessage(error, "Could not change session pause"));
  } finally {
    releaseBusy();
  }
});

cookieSiteEnabled.addEventListener("change", async () => {
  if (!pageActive || !currentSite || cookieSiteEnabled.disabled) return;
  const releaseBusy = beginPopupBusy(cookieSiteEnabled);
  const desiredProtected = cookieSiteEnabled.checked;
  cookieSiteEnabled.disabled = true;
  const statusRevision = publishSiteStatus("Applying cookie protection…");
  try {
    await runtimePolicy({ type: "drop-ads:set-cookie-exception", domain: currentSite, allowed: !desiredProtected }, "Could not change cookie protection for this site");
    await renderCommittedState(statusRevision);
  } catch (error) {
    try { await renderCommittedState(statusRevision); }
    catch { if (pageActive && cookieSiteEnabled.isConnected) cookieSiteEnabled.disabled = false; }
    publishSiteStatus(popupCaughtErrorMessage(error, "Could not change cookie protection for this site"));
  } finally {
    releaseBusy();
  }
});

cookieBannerSiteEnabled.addEventListener("change", async () => {
  if (!pageActive || !currentSite || cookieBannerSiteEnabled.disabled) return;
  const releaseBusy = beginPopupBusy(cookieBannerSiteEnabled);
  const desiredEnabled = cookieBannerSiteEnabled.checked;
  cookieBannerSiteEnabled.disabled = true;
  const statusRevision = publishSiteStatus("Applying cookie-banner preference…");
  try {
    await setCookieBannerSiteDisabled(api, currentSite, !desiredEnabled);
    await renderCommittedState(statusRevision);
    publishCommittedSiteStatus(desiredEnabled
      ? "Cookie-banner rejection is enabled here for future page loads."
      : "Cookie-banner rejection is disabled here; normal blocking stays on.", statusRevision);
  } catch (error) {
    try { await renderCommittedState(statusRevision); }
    catch { if (pageActive && cookieBannerSiteEnabled.isConnected) cookieBannerSiteEnabled.disabled = false; }
    publishSiteStatus(popupCaughtErrorMessage(error, "Could not change cookie-banner preference for this site"));
  } finally {
    releaseBusy();
  }
});

pickElement.addEventListener("click", async () => {
  if (!pageActive || !Number.isInteger(currentTabId) || pickElement.disabled) return;
  const releaseBusy = beginPopupBusy(pickElement);
  pickElement.disabled = true;
  publishSiteStatus("Starting element picker…");
  try {
    await sendPopupTopFrameMessage(api, currentTabId, { type: "drop-ads:start-element-picker" });
    if (pageActive) {
      publishSiteStatus("Element picker started on the page.");
      window.close();
    }
  } catch (error) {
    publishSiteStatus(popupCaughtErrorMessage(error, "Could not start element picker on this page"));
    if (pageActive && pickElement.isConnected) pickElement.disabled = false;
  } finally {
    releaseBusy();
  }
});

settings.addEventListener("click", async () => {
  if (!pageActive || settings.disabled) return;
  const releaseBusy = beginPopupBusy(settings);
  settings.disabled = true;
  const revision = publishGlobalStatus("Opening Settings…");
  try {
    await Promise.resolve(openPopupOptionsPage(api));
    clearGlobalStatus(revision);
  } catch (error) {
    publishGlobalStatus(popupCaughtErrorMessage(error, "Could not open Settings"));
  } finally {
    if (pageActive && settings.isConnected) settings.disabled = false;
    releaseBusy();
  }
});
