import { SESSION_STORAGE_KEY, loadSessionState } from "../core/session.js";
import { installOwnedOptionsStorageListener } from "../core/options-storage-listener.js";
import { unwrapOptionsRuntimeResponse } from "../core/options-boundary.js";
import { sendOptionsRuntimeMessage } from "../core/options-runtime.js";

const api = globalThis.browser ?? globalThis.chrome;
const settingsMain = document.querySelector("#settings-main");
const settingsNav = document.querySelector(".settings-nav");
const filterListsSection = document.querySelector("#filter-lists-settings");
let pageActive = true;
let renderGeneration = 0;
let renderQueued = false;
let internalMutationDepth = 0;
let busyDepth = 0;
let bulkRecoveryActive = false;
let recoveryMutationActive = false;
let disposeStorageSync = null;

function ensureSessionPauseNavLink() {
  const existing = settingsNav?.querySelector('a[href="#session-pauses-settings"]');
  if (existing) return existing;
  if (!settingsNav) return null;
  const navLink = document.createElement("a");
  navLink.href = "#session-pauses-settings";
  navLink.textContent = "Session pauses";
  const disabledSitesLink = settingsNav.querySelector('a[href="#disabled-sites-settings"]');
  if (disabledSitesLink) disabledSitesLink.after(navLink);
  else settingsNav.append(navLink);
  return navLink;
}

function ensureSessionPauseSection() {
  const existing = document.querySelector("#session-pauses-settings");
  if (existing) return existing;
  if (!settingsMain) return null;
  const section = document.createElement("section");
  section.id = "session-pauses-settings";
  section.setAttribute("aria-labelledby", "session-pauses-heading");
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <h2 id="session-pauses-heading">Temporary session pauses</h2>
        <p id="session-pauses-help" class="hint">Sites paused from the toolbar appear here until the browser session ends. This recovery state stays in browser session storage only and does not record visited pages, requests, timestamps, statistics, or identifiers.</p>
      </div>
      <button id="session-resume-all" type="button" aria-controls="session-pauses-list" aria-describedby="session-pauses-help session-pauses-status">Resume all</button>
    </div>
    <p id="session-pauses-status" class="hint" role="status" aria-live="polite" aria-atomic="true"></p>
    <ul id="session-pauses-list" class="rule-list" aria-label="Sites with protection paused for this browser session"></ul>
  `;
  if (filterListsSection?.parentElement) filterListsSection.before(section);
  else settingsMain.append(section);
  return section;
}

ensureSessionPauseNavLink();
const section = ensureSessionPauseSection();
const heading = section?.querySelector("#session-pauses-heading") ?? null;
const list = section?.querySelector("#session-pauses-list") ?? null;
const status = section?.querySelector("#session-pauses-status") ?? null;
const resumeAll = section?.querySelector("#session-resume-all") ?? null;

function recoverySurfaceReady() { return Boolean(section && heading && list && status && resumeAll); }

function beginSessionBusy() {
  busyDepth += 1;
  if (pageActive && section) section.setAttribute("aria-busy", "true");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    busyDepth = Math.max(0, busyDepth - 1);
    if (!pageActive) return;
    if (busyDepth === 0 && section?.isConnected) section.removeAttribute("aria-busy");
  };
}

function fixedCodeUnitSort(values) { return [...values].sort((left, right) => left < right ? -1 : left > right ? 1 : 0); }
function emptyItem() { const item = document.createElement("li"); item.className = "empty"; item.textContent = "No temporary session pauses"; return item; }

function hasSessionStateChange(changes) {
  if (!changes || (typeof changes !== "object" && typeof changes !== "function")) return false;
  try { const descriptor = Object.getOwnPropertyDescriptor(changes, SESSION_STORAGE_KEY); return Boolean(descriptor && "value" in descriptor); }
  catch { return false; }
}

function runQueuedRender() {
  renderQueued = false;
  if (!pageActive || !status) return;
  void renderSessionPauses().catch(() => { if (pageActive) status.textContent = "Could not refresh temporary session pauses."; });
}
function queueRender() {
  if (!pageActive || renderQueued || !recoverySurfaceReady()) return;
  renderQueued = true;
  try { queueMicrotask(runQueuedRender); } catch { runQueuedRender(); }
}
function installSessionStorageSync() {
  if (!status) return;
  try {
    disposeStorageSync = installOwnedOptionsStorageListener(api, (changes, areaName) => {
      if (!pageActive || internalMutationDepth > 0) return;
      if (areaName !== "session" || !hasSessionStateChange(changes)) return;
      queueRender();
    });
  } catch {
    disposeStorageSync = null;
    if (pageActive) status.textContent = "Automatic session-pause synchronization is unavailable; direct recovery still works.";
  }
}

function sessionPauseRows() { return list ? [...list.querySelectorAll("li:not(.empty)")] : []; }
function syncRecoveryControls() {
  if (!pageActive) return;
  const rows = sessionPauseRows();
  if (resumeAll) resumeAll.disabled = recoveryMutationActive || rows.length === 0;
  for (const button of list?.querySelectorAll("button.session-resume") ?? []) button.disabled = recoveryMutationActive;
}
function focusSessionHeading() { if (!pageActive || !heading) return; heading.tabIndex = -1; heading.classList.add("jump-focus-target"); heading.focus({ preventScroll: true }); }
function restoreResumeFocus(rowIndex) {
  if (!pageActive) return;
  const rows = sessionPauseRows();
  if (rows.length) { const row = rows[Math.min(rowIndex, rows.length - 1)]; row?.querySelector("button.session-resume")?.focus(); return; }
  focusSessionHeading();
}

async function resumeSessionPause(domain, button, item) {
  if (!pageActive || !status || recoveryMutationActive) return;
  recoveryMutationActive = true;
  const releaseBusy = beginSessionBusy();
  const rowIndex = Math.max(0, sessionPauseRows().indexOf(item));
  let shouldRestoreFocus = false;
  status.textContent = "";
  item.setAttribute("aria-busy", "true");
  syncRecoveryControls();
  try {
    internalMutationDepth += 1;
    try {
      const response = await sendOptionsRuntimeMessage(api, { type: "drop-ads:set-session-site-paused", domain, paused: false });
      unwrapOptionsRuntimeResponse(response, "Could not resume protection for this site");
    } finally { internalMutationDepth -= 1; }
    if (!pageActive) return;
    const rendered = await renderSessionPauses();
    if (rendered && pageActive) { status.textContent = "Protection resumed for this site."; shouldRestoreFocus = true; }
  } catch {
    if (pageActive) status.textContent = "Could not resume protection for this site.";
  } finally {
    if (pageActive && item.isConnected) item.removeAttribute("aria-busy");
    recoveryMutationActive = false;
    if (pageActive) syncRecoveryControls();
    if (shouldRestoreFocus && pageActive) restoreResumeFocus(rowIndex);
    releaseBusy();
  }
}

async function resumeAllSessionPauses() {
  if (!pageActive || !status || !resumeAll || recoveryMutationActive) return;
  recoveryMutationActive = true;
  bulkRecoveryActive = true;
  const releaseBusy = beginSessionBusy();
  status.textContent = "";
  resumeAll.setAttribute("aria-busy", "true");
  syncRecoveryControls();
  let failed = false;
  try {
    const session = await loadSessionState(api);
    if (!pageActive) return;
    const domains = fixedCodeUnitSort(session.disabledSites);
    if (!domains.length) { status.textContent = "No temporary session pauses to resume."; focusSessionHeading(); return; }
    internalMutationDepth += 1;
    try {
      for (const domain of domains) {
        if (!pageActive) return;
        try {
          const response = await sendOptionsRuntimeMessage(api, { type: "drop-ads:set-session-site-paused", domain, paused: false });
          unwrapOptionsRuntimeResponse(response, "Could not resume protection for this site");
        } catch { failed = true; }
      }
    } finally { internalMutationDepth -= 1; }
    if (!pageActive) return;
    const rendered = await renderSessionPauses();
    if (!rendered || !pageActive) return;
    if (failed) status.textContent = "Some temporary pauses could not be resumed.";
    else { status.textContent = "Protection resumed for all temporarily paused sites."; focusSessionHeading(); }
  } catch {
    failed = true;
    if (pageActive) status.textContent = "Could not resume temporary session pauses.";
  } finally {
    bulkRecoveryActive = false;
    recoveryMutationActive = false;
    if (pageActive) {
      resumeAll.removeAttribute("aria-busy");
      syncRecoveryControls();
      if (failed && resumeAll.isConnected && !resumeAll.disabled) resumeAll.focus();
    }
    releaseBusy();
  }
}

function handleResumeAllClick() { void resumeAllSessionPauses(); }

async function renderSessionPauses() {
  if (!pageActive || !recoverySurfaceReady()) return false;
  const releaseBusy = beginSessionBusy();
  try {
    const generation = ++renderGeneration;
    const session = await loadSessionState(api);
    if (!pageActive || generation !== renderGeneration) return false;
    const fragment = document.createDocumentFragment();
    const domains = fixedCodeUnitSort(session.disabledSites);
    if (!domains.length) fragment.append(emptyItem());
    else for (const domain of domains) {
      const item = document.createElement("li");
      const label = document.createElement("code"); label.textContent = domain;
      const resume = document.createElement("button");
      resume.type = "button";
      resume.className = "remove session-resume";
      resume.textContent = "Resume protection";
      resume.setAttribute("aria-label", `Resume protection on ${domain}`);
      resume.setAttribute("aria-controls", "session-pauses-list");
      resume.setAttribute("aria-describedby", "session-pauses-help session-pauses-status");
      resume.addEventListener("click", () => void resumeSessionPause(domain, resume, item));
      item.append(label, resume);
      fragment.append(item);
    }
    if (!pageActive || generation !== renderGeneration) return false;
    list.replaceChildren(fragment);
    syncRecoveryControls();
    return true;
  } finally { releaseBusy(); }
}

if (recoverySurfaceReady()) {
  resumeAll.addEventListener("click", handleResumeAllClick);
  await renderSessionPauses().catch(() => { if (pageActive && status) status.textContent = "Could not load temporary session pauses."; });
  installSessionStorageSync();
}

window.addEventListener("pagehide", () => {
  pageActive = false;
  renderGeneration += 1;
  renderQueued = false;
  internalMutationDepth = 0;
  busyDepth = 0;
  bulkRecoveryActive = false;
  recoveryMutationActive = false;
  resumeAll?.removeEventListener("click", handleResumeAllClick);
  resumeAll?.removeAttribute("aria-busy");
  section?.removeAttribute("aria-busy");
  for (const item of list?.querySelectorAll('[aria-busy="true"]') ?? []) item.removeAttribute("aria-busy");
  try { disposeStorageSync?.(); } catch { /* Best-effort Settings teardown. */ }
  disposeStorageSync = null;
}, { once: true });
