import "./form-state-semantics.js";
import "./session-pauses.js";

const requiredPolicyInputs = [
  document.querySelector("#block-input"),
  document.querySelector("#allow-input"),
  document.querySelector("#cookie-exception-input")
];

for (const input of requiredPolicyInputs) {
  if (input) input.required = true;
}

function appendDescription(control, id) {
  if (!control || !id) return;
  const tokens = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  tokens.add(id);
  control.setAttribute("aria-describedby", [...tokens].join(" "));
}

const controlledLists = new Map([
  ["#block-form button[type=\"submit\"]", "block-list"],
  ["#allow-form button[type=\"submit\"]", "allow-list"],
  ["#country-submit", "country-list"],
  ["#cosmetic-hide-form button[type=\"submit\"]", "cosmetic-hide-list"],
  ["#cosmetic-allow-form button[type=\"submit\"]", "cosmetic-allow-list"],
  ["#subscription-form button[type=\"submit\"]", "subscription-list"],
  ["#refresh-lists", "subscription-list"],
  ["#cookie-exception-form button[type=\"submit\"]", "cookie-exception-list"]
]);

for (const [selector, listId] of controlledLists) {
  const control = document.querySelector(selector);
  if (control) control.setAttribute("aria-controls", listId);
}

for (const [sectionSelector, helpId, controls] of [
  ["#personal-block-settings", "block-help", ["#block-input", "#block-form button[type=\"submit\"]"]],
  ["#personal-allow-settings", "allow-help", ["#allow-input", "#allow-form button[type=\"submit\"]"]]
]) {
  const hint = document.querySelector(`${sectionSelector} > .hint`);
  if (!hint) continue;
  hint.id = helpId;
  for (const selector of controls) appendDescription(document.querySelector(selector), helpId);
}

for (const [hintSelector, helpId, controls] of [
  ["#filter-lists-settings .section-heading .hint", "filter-lists-help", ["#refresh-lists", "#subscription-url", "#subscription-format", "#subscription-form button[type=\"submit\"]"]],
  ["#cookie-settings > .hint", "cookie-help", ["#cookie-mode", "#cookie-exception-input", "#cookie-exception-form button[type=\"submit\"]"]],
  ["#country-settings > .hint", "country-help", ["#country-preset", "#country-custom-tld", "#country-mode", "#country-submit"]],
  ["#cosmetic-settings > .hint", "cosmetic-help", ["#cosmetic-hide-domain", "#cosmetic-hide-selector", "#cosmetic-hide-form button[type=\"submit\"]", "#cosmetic-allow-domain", "#cosmetic-allow-selector", "#cosmetic-allow-form button[type=\"submit\"]"]]
]) {
  const hint = document.querySelector(hintSelector);
  if (!hint) continue;
  hint.id = helpId;
  for (const selector of controls) appendDescription(document.querySelector(selector), helpId);
}

const backupGroup = document.querySelector("#backup-settings .backup-row");
const backupHints = [...document.querySelectorAll("#backup-settings > .hint")];
if (backupGroup) {
  backupGroup.removeAttribute("aria-label");
  backupGroup.setAttribute("aria-labelledby", "backup-heading");
  const helpIds = ["backup-overview", "backup-import-help"];
  const controls = [backupGroup, document.querySelector("#export-settings"), document.querySelector("#import-settings-file"), document.querySelector("#import-settings")];
  backupHints.slice(0, helpIds.length).forEach((hint, index) => {
    hint.id = helpIds[index];
    for (const control of controls) appendDescription(control, helpIds[index]);
  });
}

const subscriptionList = document.querySelector("#subscription-list");
let subscriptionObserver = null;

function labelSubscriptionToggles() {
  if (!subscriptionList) return;
  for (const row of subscriptionList.querySelectorAll("li.subscription-item")) {
    const title = row.querySelector("strong")?.textContent?.trim();
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (title && checkbox) checkbox.setAttribute("aria-label", `Enabled — ${title}`);
  }
}

if (subscriptionList && typeof globalThis.MutationObserver === "function") {
  labelSubscriptionToggles();
  subscriptionObserver = new globalThis.MutationObserver(labelSubscriptionToggles);
  subscriptionObserver.observe(subscriptionList, { childList: true });
}

const disabledSitesList = document.querySelector("#disabled-sites");
const disabledSitesHeading = document.querySelector("#disabled-sites-heading");
const disabledSitesHelp = document.querySelector("#disabled-sites-settings > .hint");
let disabledSitesObserver = null;
let disabledSiteRecoveryPending = false;
if (disabledSitesHelp) disabledSitesHelp.id = "disabled-sites-help";

function labelDisabledSiteActions() {
  if (!disabledSitesList) return;
  let rowIndex = 0;
  for (const row of disabledSitesList.querySelectorAll("li:not(.empty)")) {
    rowIndex += 1;
    const siteNode = row.querySelector("code");
    const site = siteNode?.textContent?.trim();
    const action = row.querySelector("button.remove");
    if (!site || !siteNode || !action) continue;
    const siteId = `disabled-site-${rowIndex}`;
    siteNode.id = siteId;
    action.textContent = "Re-enable";
    action.setAttribute("aria-label", `Re-enable protection on ${site}`);
    action.setAttribute("aria-describedby", `${siteId} disabled-sites-help`);
  }
}

function handleDisabledSiteAction(event) {
  const action = event.target?.closest?.("button.remove");
  if (action && disabledSitesList?.contains(action)) disabledSiteRecoveryPending = true;
}

function handleDisabledSitesMutation() {
  labelDisabledSiteActions();
  if (!disabledSiteRecoveryPending) return;
  disabledSiteRecoveryPending = false;
  if (disabledSitesList?.querySelector("button.remove")) return;
  if (!disabledSitesHeading) return;
  disabledSitesHeading.tabIndex = -1;
  disabledSitesHeading.classList.add("jump-focus-target");
  disabledSitesHeading.focus({ preventScroll: true });
}

if (disabledSitesList && typeof globalThis.MutationObserver === "function") {
  labelDisabledSiteActions();
  disabledSitesList.addEventListener("click", handleDisabledSiteAction);
  disabledSitesObserver = new globalThis.MutationObserver(handleDisabledSitesMutation);
  disabledSitesObserver.observe(disabledSitesList, { childList: true });
}

const cookieExceptionList = document.querySelector("#cookie-exception-list");
let cookieExceptionObserver = null;

function labelCookieExceptionActions() {
  if (!cookieExceptionList) return;
  let rowIndex = 0;
  for (const row of cookieExceptionList.querySelectorAll("li:not(.empty)")) {
    rowIndex += 1;
    const siteNode = row.querySelector("code");
    const site = siteNode?.textContent?.trim();
    const action = row.querySelector("button.remove");
    if (!site || !siteNode || !action) continue;
    const siteId = `cookie-exception-site-${rowIndex}`;
    siteNode.id = siteId;
    action.textContent = "Remove exception";
    action.setAttribute("aria-label", `Remove cookie exception for ${site}`);
    action.setAttribute("aria-describedby", `${siteId} cookie-help cookie-exception-error`);
  }
}

if (cookieExceptionList && typeof globalThis.MutationObserver === "function") {
  labelCookieExceptionActions();
  cookieExceptionObserver = new globalThis.MutationObserver(labelCookieExceptionActions);
  cookieExceptionObserver.observe(cookieExceptionList, { childList: true });
}

const settingsNav = document.querySelector(".settings-nav");
function updateCurrentSettingsNav() {
  const current = globalThis.location?.hash ?? "";
  for (const link of settingsNav?.querySelectorAll("a[href^=\"#\"]") ?? []) {
    if (current && link.getAttribute("href") === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

function focusSettingsDestination(event) {
  const link = event.target?.closest?.('a[href^="#"]');
  if (!link || !settingsNav?.contains(link)) return;
  const href = link.getAttribute("href");
  if (!href || !/^#[A-Za-z][A-Za-z0-9_-]*$/.test(href)) return;
  const section = document.getElementById(href.slice(1));
  const heading = section?.querySelector("h2");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.classList.add("jump-focus-target");
  heading.focus({ preventScroll: true });
}

updateCurrentSettingsNav();
window.addEventListener("hashchange", updateCurrentSettingsNav);
settingsNav?.addEventListener("click", focusSettingsDestination);

const importSettingsFile = document.querySelector("#import-settings-file");
const importSettingsButton = document.querySelector("#import-settings");
const backupStatus = document.querySelector("#backup-status");
const backupError = document.querySelector("#backup-error");
let backupStatusObserver = null;

function syncImportAvailability() {
  if (!importSettingsButton) return;
  importSettingsButton.disabled = !(importSettingsFile?.files?.length > 0);
}

function handleImportFileSelection() {
  syncImportAvailability();
  if (!(importSettingsFile?.files?.length > 0)) return;
  if (backupError) backupError.textContent = "";
  if (backupStatus) backupStatus.textContent = "Backup file selected and ready to import.";
}

syncImportAvailability();
importSettingsFile?.addEventListener("change", handleImportFileSelection);
if (backupStatus && typeof globalThis.MutationObserver === "function") {
  backupStatusObserver = new globalThis.MutationObserver(syncImportAvailability);
  backupStatusObserver.observe(backupStatus, { childList: true, characterData: true, subtree: true });
}

window.addEventListener("pagehide", () => {
  try { subscriptionObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  subscriptionObserver = null;
  try { disabledSitesObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  disabledSitesObserver = null;
  disabledSitesList?.removeEventListener("click", handleDisabledSiteAction);
  try { cookieExceptionObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  cookieExceptionObserver = null;
  try { backupStatusObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  backupStatusObserver = null;
  window.removeEventListener("hashchange", updateCurrentSettingsNav);
  settingsNav?.removeEventListener("click", focusSettingsDestination);
  importSettingsFile?.removeEventListener("change", handleImportFileSelection);
}, { once: true });
