const popupMain = document.querySelector("#popup-main");
const siteSection = document.querySelector("#site-section");
const siteName = document.querySelector("#site-name");
const enabled = document.querySelector("#enabled");
const siteEnabled = document.querySelector("#site-enabled");
const cookieSiteRow = document.querySelector("#cookie-site-row");
const cookieSiteEnabled = document.querySelector("#cookie-site-enabled");
const pauseSite = document.querySelector("#pause-site");
const pickElement = document.querySelector("#pick-element");
const sessionStatus = document.querySelector("#session-status");
const shortcutHelpNote = document.querySelector("#shortcut-help-note");
const shortcutList = document.querySelector("#shortcut-help-list");
const shortcutRows = [...document.querySelectorAll(".shortcut-list li")];

let pageActive = true;
let syncQueued = false;
let observer = null;
let pauseObserver = null;
let siteLabelObserver = null;
let sessionStatusObserver = null;
let shortcutPresentationObserver = null;
let lastDerivedStatus = "";

function shortcutAvailabilityMarker(row) {
  let marker = row.querySelector(".shortcut-availability");
  if (marker) return marker;
  marker = document.createElement("span");
  marker.className = "shortcut-availability";
  marker.textContent = "Unavailable";
  row.append(marker);
  return marker;
}

function syncShortcutHelpNote() {
  if (!shortcutHelpNote) return;
  const unavailable = shortcutRows.some((row) => row.getAttribute("aria-disabled") === "true");
  const next = unavailable
    ? "Unavailable shortcuts are marked below. Site shortcuts require an HTTP(S) page, and busy controls temporarily reject shortcuts."
    : "All listed shortcuts are currently available while this popup is open.";
  if (shortcutHelpNote.textContent !== next) shortcutHelpNote.textContent = next;
}

function syncShortcutPresentation() {
  if (!pageActive) return;
  for (const row of shortcutRows) {
    const unavailable = row.getAttribute("aria-disabled") === "true";
    shortcutAvailabilityMarker(row).hidden = !unavailable;
  }
  syncShortcutHelpNote();
}

function syncPausePressedState() {
  if (!pauseSite) return;
  const pauseText = pauseSite.textContent?.trim() ?? "";
  const paused = pauseText === "Resume this session";
  pauseSite.setAttribute("aria-pressed", paused ? "true" : "false");
}

function syncSiteControlLabels() {
  const site = siteName?.textContent?.trim() ?? "";
  if (!site) return;
  siteEnabled?.setAttribute("aria-label", `Protection on ${site}`);
  cookieSiteEnabled?.setAttribute("aria-label", `Cookie protection on ${site}`);
  const paused = pauseSite?.getAttribute("aria-pressed") === "true";
  pauseSite?.setAttribute(
    "aria-label",
    paused ? `Resume protection on ${site} for this browser session` : `Pause protection on ${site} until browser restart`
  );
  pickElement?.setAttribute("aria-label", `Pick element to block on ${site}`);
}

function derivedStatusText() {
  if (!siteSection || siteSection.hidden) return "";
  if (siteEnabled && !siteEnabled.checked) return "Protection is disabled for this site until you turn it back on.";
  if (pauseSite?.textContent?.trim() === "Resume this session") return "Protection is paused for this browser session only.";
  if (enabled && !enabled.checked) return "Global blocking is off; this site's saved protection settings remain local and will apply when blocking is turned back on.";
  if (cookieSiteRow && !cookieSiteRow.hidden && cookieSiteEnabled && !cookieSiteEnabled.checked) {
    return "Cookie protection is disabled for this site by a local exception.";
  }
  return "";
}

function releaseDerivedStatusOwnership() {
  if (!sessionStatus || sessionStatus.dataset.derivedStatus !== "true") return;
  const current = sessionStatus.textContent?.trim() ?? "";
  if (current === lastDerivedStatus) return;
  delete sessionStatus.dataset.derivedStatus;
  lastDerivedStatus = "";
}

function syncDerivedStatus() {
  syncQueued = false;
  if (!pageActive || !sessionStatus || popupMain?.getAttribute("aria-busy") === "true") return;

  releaseDerivedStatusOwnership();
  const ownsCurrentText = sessionStatus.dataset.derivedStatus === "true";
  const existing = sessionStatus.textContent?.trim() ?? "";
  if (existing && !ownsCurrentText) return;

  const next = derivedStatusText();
  lastDerivedStatus = next;
  if (existing !== next) sessionStatus.textContent = next;
  if (next) sessionStatus.dataset.derivedStatus = "true";
  else delete sessionStatus.dataset.derivedStatus;
}

function queueDerivedStatusSync() {
  if (!pageActive || syncQueued) return;
  syncQueued = true;
  try { queueMicrotask(syncDerivedStatus); }
  catch { syncDerivedStatus(); }
}

function handlePopupInteraction() {
  syncPausePressedState();
  syncSiteControlLabels();
  queueDerivedStatusSync();
}

function handlePopupMutation() {
  queueDerivedStatusSync();
}

function handleSessionStatusMutation() {
  releaseDerivedStatusOwnership();
  queueDerivedStatusSync();
}

syncPausePressedState();
syncSiteControlLabels();
syncShortcutPresentation();
queueDerivedStatusSync();
if (popupMain && typeof globalThis.MutationObserver === "function") {
  observer = new globalThis.MutationObserver(handlePopupMutation);
  observer.observe(popupMain, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-busy", "disabled", "hidden"]
  });
}
if (shortcutList && typeof globalThis.MutationObserver === "function") {
  shortcutPresentationObserver = new globalThis.MutationObserver((mutations) => {
    if (!pageActive || !mutations.some((mutation) => mutation.type === "attributes" && mutation.attributeName === "aria-disabled")) return;
    syncShortcutPresentation();
  });
  shortcutPresentationObserver.observe(shortcutList, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-disabled"]
  });
}
if (pauseSite && typeof globalThis.MutationObserver === "function") {
  pauseObserver = new globalThis.MutationObserver(handlePopupInteraction);
  pauseObserver.observe(pauseSite, { childList: true, characterData: true, subtree: true });
}
if (siteName && typeof globalThis.MutationObserver === "function") {
  siteLabelObserver = new globalThis.MutationObserver(syncSiteControlLabels);
  siteLabelObserver.observe(siteName, { childList: true, characterData: true, subtree: true });
}
if (sessionStatus && typeof globalThis.MutationObserver === "function") {
  sessionStatusObserver = new globalThis.MutationObserver(handleSessionStatusMutation);
  sessionStatusObserver.observe(sessionStatus, { childList: true, characterData: true, subtree: true });
}

for (const control of [enabled, siteEnabled, cookieSiteEnabled, pauseSite]) control?.addEventListener("change", handlePopupInteraction);
pauseSite?.addEventListener("click", handlePopupInteraction);

window.addEventListener("pagehide", () => {
  pageActive = false;
  syncQueued = false;
  lastDerivedStatus = "";
  try { observer?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  observer = null;
  try { shortcutPresentationObserver?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  shortcutPresentationObserver = null;
  try { pauseObserver?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  pauseObserver = null;
  try { siteLabelObserver?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  siteLabelObserver = null;
  try { sessionStatusObserver?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  sessionStatusObserver = null;
  for (const control of [enabled, siteEnabled, cookieSiteEnabled, pauseSite]) control?.removeEventListener("change", handlePopupInteraction);
  pauseSite?.removeEventListener("click", handlePopupInteraction);
}, { once: true });
