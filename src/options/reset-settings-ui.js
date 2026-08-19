import { optionsCaughtErrorMessage } from "../core/options-boundary.js";
import { sendOptionsRuntimeMessage } from "../core/options-runtime.js";
import { unwrapSettingsResetResponse } from "../core/settings-reset-response.js";

const api = globalThis.browser ?? globalThis.chrome;
const settingsMain = document.querySelector("#settings-main");
const settingsNav = document.querySelector(".settings-nav");
const backupSection = document.querySelector("#backup-settings");
const RESET_CONFIRMATION = "Reset all configured Drop Ads settings to defaults? Personal rules, persistent site exceptions, cookie settings, filter-list subscriptions, and contribution preferences will be replaced. Temporary session pauses will remain until the browser session ends.";
const RESET_TARGETS = "block-list allow-list country-list cosmetic-hide-list cosmetic-allow-list disabled-sites subscription-list cookie-exception-list";
let pageActive = true;
let resetBusy = false;
let resetPanel = null;
let resetButton = null;
let resetStatus = null;
let resetError = null;
let resetConfirmPanel = null;
let resetConfirmButton = null;
let resetCancelButton = null;

function ensureResetNavLink() {
  if (!settingsNav) return null;
  const existing = settingsNav.querySelector('a[href="#reset-settings-section"]');
  if (existing) return existing;
  const link = document.createElement("a");
  link.href = "#reset-settings-section";
  link.textContent = "Reset";
  const backupLink = settingsNav.querySelector('a[href="#backup-settings"]');
  if (backupLink) backupLink.after(link);
  else settingsNav.append(link);
  return link;
}

function synchronizeInitialResetFragment(section, link) {
  if (globalThis.location?.hash !== "#reset-settings-section") return;
  link?.setAttribute("aria-current", "location");
  const heading = section?.querySelector("#reset-settings-heading");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.classList.add("jump-focus-target");
  heading.focus();
}

function createResetSurface() {
  if (!settingsMain || !backupSection) return null;
  const existing = document.querySelector("#reset-settings-section");
  if (existing) {
    const link = ensureResetNavLink();
    synchronizeInitialResetFragment(existing, link);
    return existing;
  }

  const section = document.createElement("section");
  section.id = "reset-settings-section";
  section.className = "reset-settings-panel";
  section.setAttribute("aria-labelledby", "reset-settings-heading");

  const heading = document.createElement("h2");
  heading.id = "reset-settings-heading";
  heading.textContent = "Reset configured settings";

  const help = document.createElement("p");
  help.id = "reset-settings-help";
  help.className = "hint";
  help.textContent = "Restores configured Drop Ads defaults: protection preferences, personal network and cosmetic rules, persistent disabled sites, cookie settings, filter-list subscriptions, and community contribution preference.";

  const sessionNote = document.createElement("p");
  sessionNote.id = "reset-settings-session-note";
  sessionNote.className = "hint reset-session-note";
  sessionNote.textContent = "Temporary session pauses are separate ephemeral recovery state and are not cleared by this action. They remain until resumed or the browser session ends.";

  const privacy = document.createElement("p");
  privacy.id = "reset-settings-privacy";
  privacy.className = "hint";
  privacy.textContent = "This is a local recovery action. Drop Ads does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry.";

  const button = document.createElement("button");
  button.id = "reset-settings";
  button.type = "button";
  button.textContent = "Reset configured settings";
  button.setAttribute("aria-describedby", "reset-settings-help reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error");
  button.setAttribute("aria-controls", "reset-settings-confirmation");
  button.setAttribute("aria-expanded", "false");

  const confirmation = document.createElement("div");
  confirmation.id = "reset-settings-confirmation";
  confirmation.className = "reset-confirmation";
  confirmation.hidden = true;
  confirmation.setAttribute("role", "group");
  confirmation.setAttribute("aria-labelledby", "reset-settings-confirmation-text");
  confirmation.setAttribute("aria-describedby", "reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error");
  confirmation.setAttribute("aria-keyshortcuts", "Escape");

  const confirmationText = document.createElement("p");
  confirmationText.id = "reset-settings-confirmation-text";
  confirmationText.className = "hint";
  confirmationText.textContent = RESET_CONFIRMATION;

  const confirmationActions = document.createElement("div");
  confirmationActions.className = "reset-confirmation-actions";

  const confirmButton = document.createElement("button");
  confirmButton.id = "confirm-reset-settings";
  confirmButton.type = "button";
  confirmButton.textContent = "Confirm reset";
  confirmButton.setAttribute("aria-describedby", "reset-settings-confirmation-text reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error");
  confirmButton.setAttribute("aria-controls", RESET_TARGETS);

  const cancelButton = document.createElement("button");
  cancelButton.id = "cancel-reset-settings";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.setAttribute("aria-describedby", "reset-settings-confirmation-text reset-settings-session-note");

  confirmationActions.append(confirmButton, cancelButton);
  confirmation.append(confirmationText, confirmationActions);

  const status = document.createElement("p");
  status.id = "reset-settings-status";
  status.className = "hint";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  const error = document.createElement("p");
  error.id = "reset-settings-error";
  error.className = "error";
  error.setAttribute("role", "alert");
  error.setAttribute("aria-atomic", "true");

  section.append(heading, help, sessionNote, privacy, button, confirmation, status, error);
  backupSection.insertAdjacentElement("afterend", section);
  const link = ensureResetNavLink();
  synchronizeInitialResetFragment(section, link);
  return section;
}

function setConfirmationVisible(visible) {
  if (!resetConfirmPanel || !resetButton) return;
  resetConfirmPanel.hidden = !visible;
  resetButton.setAttribute("aria-expanded", visible ? "true" : "false");
}

function setResetBusy(busy) {
  resetBusy = busy;
  if (resetButton) {
    resetButton.disabled = busy;
    if (busy) resetButton.setAttribute("aria-busy", "true");
    else resetButton.removeAttribute("aria-busy");
  }
  if (resetConfirmButton) {
    resetConfirmButton.disabled = busy;
    if (busy) resetConfirmButton.setAttribute("aria-busy", "true");
    else resetConfirmButton.removeAttribute("aria-busy");
  }
  if (resetCancelButton) resetCancelButton.disabled = busy;
  if (busy) resetPanel?.setAttribute("aria-busy", "true");
  else resetPanel?.removeAttribute("aria-busy");
}

function requestConfiguredReset() {
  if (!pageActive || resetBusy || !resetButton || resetButton.disabled) return;
  resetError.textContent = "";
  resetStatus.textContent = "";
  setConfirmationVisible(true);
  resetConfirmButton?.focus();
}

function cancelConfiguredReset() {
  if (!pageActive || resetBusy) return;
  setConfirmationVisible(false);
  resetStatus.textContent = "Configured settings reset cancelled.";
  resetButton?.focus();
}

function handleConfirmationKeydown(event) {
  if (event.key !== "Escape" || resetBusy || resetConfirmPanel?.hidden) return;
  event.preventDefault();
  cancelConfiguredReset();
}

async function confirmConfiguredReset() {
  if (!pageActive || resetBusy || !resetConfirmButton || resetConfirmButton.disabled) return;
  const primaryText = resetButton?.textContent ?? "Reset configured settings";
  const confirmText = resetConfirmButton.textContent;
  let succeeded = false;
  setResetBusy(true);
  if (resetButton) resetButton.textContent = "Resetting…";
  resetConfirmButton.textContent = "Resetting…";
  resetStatus.textContent = "Resetting configured settings…";
  resetError.textContent = "";
  try {
    const response = await sendOptionsRuntimeMessage(api, { type: "drop-ads:reset-settings" });
    unwrapSettingsResetResponse(response, "Could not reset configured settings");
    succeeded = true;
    if (pageActive) {
      setConfirmationVisible(false);
      resetStatus.textContent = "Configured settings restored to defaults. Temporary session pauses were left unchanged.";
    }
  } catch (error) {
    if (pageActive) resetError.textContent = optionsCaughtErrorMessage(error, "Could not reset configured settings");
  } finally {
    if (pageActive && resetButton?.isConnected && resetConfirmButton?.isConnected) {
      resetButton.textContent = primaryText;
      resetConfirmButton.textContent = confirmText;
      setResetBusy(false);
      (succeeded ? resetButton : resetConfirmButton).focus();
    }
  }
}

resetPanel = createResetSurface();
resetButton = resetPanel?.querySelector("#reset-settings") ?? null;
resetStatus = resetPanel?.querySelector("#reset-settings-status") ?? null;
resetError = resetPanel?.querySelector("#reset-settings-error") ?? null;
resetConfirmPanel = resetPanel?.querySelector("#reset-settings-confirmation") ?? null;
resetConfirmButton = resetPanel?.querySelector("#confirm-reset-settings") ?? null;
resetCancelButton = resetPanel?.querySelector("#cancel-reset-settings") ?? null;
resetButton?.addEventListener("click", requestConfiguredReset);
resetConfirmButton?.addEventListener("click", confirmConfiguredReset);
resetCancelButton?.addEventListener("click", cancelConfiguredReset);
resetConfirmPanel?.addEventListener("keydown", handleConfirmationKeydown);

window.addEventListener("pagehide", () => {
  pageActive = false;
  resetBusy = false;
  resetButton?.removeEventListener("click", requestConfiguredReset);
  resetConfirmButton?.removeEventListener("click", confirmConfiguredReset);
  resetCancelButton?.removeEventListener("click", cancelConfiguredReset);
  resetConfirmPanel?.removeEventListener("keydown", handleConfirmationKeydown);
}, { once: true });

export function isResetSettingsPageActive() { return pageActive; }
