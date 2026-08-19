import { normalizeDomain, ruleKey } from "../core/rules.js";
import { ruleFromUserInput } from "../core/personal-rules.js";
import { personalRuleConflictKeys } from "../core/rule-conflicts.js";
import { normalizeSubscription } from "../core/subscriptions.js";
import { createSettingsBackup, MAX_SETTINGS_BACKUP_BYTES } from "../core/settings-backup.js";
import { loadState, saveState, STORAGE_KEY } from "../core/storage.js";
import {
  isRelevantOptionsStorageChange,
  optionsCaughtErrorMessage,
  unwrapOptionsImportResponse,
  unwrapOptionsRefreshResponse,
  unwrapOptionsRuntimeResponse,
  unwrapOptionsSimpleResponse,
  unwrapOptionsSubscriptionResponse
} from "../core/options-boundary.js";
import { sendOptionsRuntimeMessage } from "../core/options-runtime.js";
import { installOwnedOptionsStorageListener } from "../core/options-storage-listener.js";

const api = globalThis.browser ?? globalThis.chrome;
const autoSubmit = document.querySelector("#auto-submit");
const cookieMode = document.querySelector("#cookie-mode");
const cookieExceptionForm = document.querySelector("#cookie-exception-form");
const cookieExceptionInput = document.querySelector("#cookie-exception-input");
const cookieExceptionError = document.querySelector("#cookie-exception-error");
const cookieExceptionList = document.querySelector("#cookie-exception-list");
const blockForm = document.querySelector("#block-form");
const blockInput = document.querySelector("#block-input");
const blockError = document.querySelector("#block-error");
const blockList = document.querySelector("#block-list");
const allowForm = document.querySelector("#allow-form");
const allowInput = document.querySelector("#allow-input");
const allowError = document.querySelector("#allow-error");
const allowList = document.querySelector("#allow-list");
const disabledSites = document.querySelector("#disabled-sites");
const subscriptionForm = document.querySelector("#subscription-form");
const subscriptionUrl = document.querySelector("#subscription-url");
const subscriptionFormat = document.querySelector("#subscription-format");
const subscriptionError = document.querySelector("#subscription-error");
const subscriptionList = document.querySelector("#subscription-list");
const refreshLists = document.querySelector("#refresh-lists");
const refreshStatus = document.querySelector("#refresh-status");
const exportSettingsButton = document.querySelector("#export-settings");
const importSettingsFile = document.querySelector("#import-settings-file");
const importSettingsButton = document.querySelector("#import-settings");
const backupStatus = document.querySelector("#backup-status");
const backupError = document.querySelector("#backup-error");

const blockSubmit = blockForm.querySelector('button[type="submit"]');
const allowSubmit = allowForm.querySelector('button[type="submit"]');
const cookieExceptionSubmit = cookieExceptionForm.querySelector('button[type="submit"]');
const subscriptionSubmit = subscriptionForm.querySelector('button[type="submit"]');

let internalMutationDepth = 0;
let renderQueued = false;
let lastCommittedCookieMode = cookieMode.value;
let pageActive = true;
let disposeStorageLiveSync = null;

window.addEventListener("pagehide", () => {
  pageActive = false;
  renderQueued = false;
  try { disposeStorageLiveSync?.(); } catch { /* Best-effort page teardown. */ }
  disposeStorageLiveSync = null;
}, { once: true });

await render().catch((error) => {
  if (pageActive) blockError.textContent = optionsCaughtErrorMessage(error, "Could not load Settings");
});

autoSubmit.addEventListener("change", persistAutoSubmitPreference);
cookieMode.addEventListener("change", persistCookieMode);
cookieExceptionForm.addEventListener("submit", addCookieException);
blockForm.addEventListener("submit", (event) => addRule(event, "personalBlock", blockInput, blockError, blockSubmit));
allowForm.addEventListener("submit", (event) => addRule(event, "personalAllow", allowInput, allowError, allowSubmit));
subscriptionForm.addEventListener("submit", addSubscription);
refreshLists.addEventListener("click", () => refreshRemoteLists(true).catch(() => undefined));
exportSettingsButton.addEventListener("click", exportSettingsBackup);
importSettingsButton.addEventListener("click", importSettingsBackup);

function runQueuedRender() {
  renderQueued = false;
  if (!pageActive) return;
  void render().catch((error) => {
    if (pageActive) blockError.textContent = optionsCaughtErrorMessage(error, "Could not refresh Settings");
  });
}

function queueRender() {
  if (!pageActive || renderQueued) return;
  renderQueued = true;
  try {
    queueMicrotask(runQueuedRender);
  } catch {
    runQueuedRender();
  }
}

function installStorageLiveSync() {
  if (!pageActive) return false;
  try {
    disposeStorageLiveSync = installOwnedOptionsStorageListener(api, (changes, areaName) => {
      if (!pageActive) return;
      if (!isRelevantOptionsStorageChange(changes, areaName, STORAGE_KEY)) return;
      if (internalMutationDepth > 0) return;
      queueRender();
    });
    return true;
  } catch {
    disposeStorageLiveSync = null;
    if (pageActive) {
      blockError.textContent = optionsCaughtErrorMessage(
        null,
        "Automatic Settings synchronization is unavailable; direct changes still work."
      );
    }
    return false;
  }
}

installStorageLiveSync();

async function withInternalMutation(task) {
  internalMutationDepth += 1;
  try {
    return await task();
  } finally {
    internalMutationDepth -= 1;
  }
}

async function runtimePolicy(message, fallback) {
  return withInternalMutation(async () => {
    const response = await sendOptionsRuntimeMessage(api, message);
    return unwrapOptionsRuntimeResponse(response, fallback);
  });
}

async function withBusy(control, busyText, task, owner = control) {
  const originalText = control.textContent;
  control.disabled = true;
  owner.setAttribute("aria-busy", "true");
  if (busyText) control.textContent = busyText;
  try {
    return await task();
  } finally {
    if (busyText) control.textContent = originalText;
    owner.removeAttribute("aria-busy");
    control.disabled = false;
  }
}

async function refreshCommittedView(task, statusNode, failureText) {
  const safeFailure = optionsCaughtErrorMessage(null, failureText);
  try {
    await task();
    return true;
  } catch {
    if (pageActive) statusNode.textContent = safeFailure;
    return false;
  }
}

async function persistAutoSubmitPreference() {
  const desired = autoSubmit.checked;
  autoSubmit.disabled = true;
  try {
    await withInternalMutation(async () => {
      const next = await loadState(api);
      next.autoSubmitCommunity = desired;
      await saveState(api, next);
    });
  } catch (error) {
    autoSubmit.checked = !desired;
    blockError.textContent = optionsCaughtErrorMessage(error, "Could not save contribution preference");
  } finally {
    autoSubmit.disabled = false;
  }
}

async function persistCookieMode() {
  const desired = cookieMode.value;
  const previousCommitted = lastCommittedCookieMode;
  cookieMode.disabled = true;
  cookieMode.setAttribute("aria-busy", "true");
  cookieExceptionError.textContent = "Applying cookie mode…";
  try {
    await runtimePolicy({ type: "drop-ads:set-cookie-mode", cookieMode: desired }, "Could not change cookie mode");
    lastCommittedCookieMode = desired;
    cookieExceptionError.textContent = "";
  } catch (error) {
    const primaryMessage = optionsCaughtErrorMessage(error, "Could not change cookie mode");
    let restored = false;
    try {
      const state = await loadState(api);
      cookieMode.value = state.cookieMode;
      lastCommittedCookieMode = state.cookieMode;
      restored = true;
    } catch {
      // The original mutation failure remains authoritative if recovery also fails.
    }
    if (!restored) cookieMode.value = previousCommitted;
    cookieExceptionError.textContent = primaryMessage;
  } finally {
    cookieMode.removeAttribute("aria-busy");
    cookieMode.disabled = false;
  }
}

async function addCookieException(event) {
  event.preventDefault();
  cookieExceptionError.textContent = "";
  await withBusy(cookieExceptionSubmit, "Adding…", async () => {
    try {
      const domain = normalizeDomain(cookieExceptionInput.value);
      await runtimePolicy({ type: "drop-ads:set-cookie-exception", domain, allowed: true }, "Could not add cookie exception");
      cookieExceptionInput.value = "";
      const refreshed = await refreshCommittedView(
        () => refreshDomainList("cookieAllowSites"),
        cookieExceptionError,
        "Cookie exception is active, but Settings could not refresh the site list."
      );
      if (refreshed) cookieExceptionInput.focus();
    } catch (error) {
      cookieExceptionError.textContent = optionsCaughtErrorMessage(error, "Could not add cookie exception");
    }
  }, cookieExceptionForm);
}

async function addRule(event, field, input, errorNode, submitButton) {
  event.preventDefault();
  errorNode.textContent = "";
  await withBusy(submitButton, "Adding…", async () => {
    try {
      const candidate = ruleFromUserInput(input.value);
      const result = await runtimePolicy({ type: "drop-ads:add-personal-rule", field, rule: candidate }, "Could not add rule");
      input.value = "";
      const refreshed = await refreshCommittedView(
        refreshPersonalLists,
        errorNode,
        "Rule change is active, but Settings could not refresh the personal rule lists."
      );
      if (refreshed) input.focus();
      if (field === "personalBlock" && result?.communitySubmission === "failed") {
        errorNode.textContent = refreshed
          ? "Rule added locally and is active, but the optional GitHub community submission could not be prepared."
          : "Rule added locally and is active, but Settings could not refresh the rule list and the optional GitHub community submission could not be prepared.";
      }
    } catch (error) {
      errorNode.textContent = optionsCaughtErrorMessage(error, "Could not add rule");
    }
  }, field === "personalBlock" ? blockForm : allowForm);
}

async function prepareCommunitySubmission(rule, button) {
  blockError.textContent = "";
  await withBusy(button, "Opening…", async () => {
    try {
      const response = await sendOptionsRuntimeMessage(api, { type: "drop-ads:submit-community", rule });
      unwrapOptionsSimpleResponse(response, "Could not prepare community submission");
    } catch (error) {
      blockError.textContent = optionsCaughtErrorMessage(error, "Could not prepare community submission");
    }
  });
}

async function addSubscription(event) {
  event.preventDefault();
  subscriptionError.textContent = "";
  await withBusy(subscriptionSubmit, "Adding…", async () => {
    try {
      const url = new URL(subscriptionUrl.value);
      const candidate = normalizeSubscription({
        id: `external-${crypto.randomUUID()}`,
        title: url.hostname,
        format: subscriptionFormat.value,
        sourceUrl: url.href,
        enabled: true,
        builtIn: false
      });
      const subscription = await withInternalMutation(async () => unwrapOptionsSubscriptionResponse(
        await sendOptionsRuntimeMessage(api, { type: "drop-ads:add-subscription", subscription: candidate }),
        "Could not add filter list"
      ));
      subscriptionUrl.value = "";
      refreshStatus.textContent = `${subscription.title ?? candidate.title} added and activated.`;
      const refreshed = await refreshCommittedView(
        refreshSubscriptions,
        subscriptionError,
        "Filter list was added and activated, but Settings could not refresh the subscription list."
      );
      if (refreshed) subscriptionUrl.focus();
    } catch (error) {
      subscriptionError.textContent = optionsCaughtErrorMessage(error, "Could not add subscription");
    }
  }, subscriptionForm);
}

async function setSubscriptionEnabled(subscription, enabled) {
  const result = await withInternalMutation(async () => unwrapOptionsSubscriptionResponse(
    await sendOptionsRuntimeMessage(api, { type: "drop-ads:set-subscription-enabled", id: subscription.id, enabled }),
    "Could not change filter list state"
  ));
  const source = result.source;
  const sourceNote = enabled && source === "fetched"
    ? " Source was fetched and validated because no reusable cache existed."
    : enabled && source === "bundled"
      ? " Packaged Drop Ads baseline was used because no reusable cache existed."
      : "";
  refreshStatus.textContent = `${subscription.title} ${enabled ? "enabled" : "disabled"}.${sourceNote}`;
  return result;
}

async function removeSubscription(subscription) {
  const result = await withInternalMutation(async () => unwrapOptionsSubscriptionResponse(
    await sendOptionsRuntimeMessage(api, { type: "drop-ads:remove-subscription", id: subscription.id }),
    "Could not remove filter list"
  ));
  refreshStatus.textContent = `${subscription.title} removed; its cached rules were pruned.`;
  return result;
}

async function refreshRemoteLists(force) {
  refreshLists.disabled = true;
  refreshLists.setAttribute("aria-busy", "true");
  const originalText = refreshLists.textContent;
  refreshLists.textContent = "Refreshing…";
  refreshStatus.textContent = "Refreshing enabled lists…";
  try {
    const status = await withInternalMutation(async () => unwrapOptionsRefreshResponse(
      await sendOptionsRuntimeMessage(api, { type: "drop-ads:refresh-lists", force }),
      "List refresh failed"
    ));
    const messages = {
      updated: "Lists refreshed.",
      "updated-with-fallback": "Available lists refreshed; at least one source kept its last-known-good copy.",
      fallback: "Could not refresh a source; last-known-good rules remain active.",
      current: "Lists are already current."
    };
    refreshStatus.textContent = messages[status] ?? "List refresh complete.";
    return status;
  } catch (error) {
    refreshStatus.textContent = optionsCaughtErrorMessage(error, "List refresh failed");
    throw error;
  } finally {
    refreshLists.textContent = originalText;
    refreshLists.removeAttribute("aria-busy");
    refreshLists.disabled = false;
  }
}

async function exportSettingsBackup() {
  backupError.textContent = "";
  backupStatus.textContent = "";
  await withBusy(exportSettingsButton, "Exporting…", async () => {
    try {
      const backup = createSettingsBackup(await loadState(api));
      const text = `${JSON.stringify(backup, null, 2)}\n`;
      if (new TextEncoder().encode(text).byteLength > MAX_SETTINGS_BACKUP_BYTES) throw new Error("Settings are too large for the supported backup format");
      const blob = new Blob([text], { type: "application/json" });
      const objectUrl = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = "drop-ads-settings.json";
        anchor.hidden = true;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      } finally { URL.revokeObjectURL(objectUrl); }
      backupStatus.textContent = "Settings backup created locally.";
    } catch (error) {
      backupError.textContent = optionsCaughtErrorMessage(error, "Could not export settings");
    }
  });
}

async function importSettingsBackup() {
  backupError.textContent = "";
  backupStatus.textContent = "";
  const file = importSettingsFile.files?.[0];
  if (!file) { backupError.textContent = "Choose a Drop Ads JSON backup first."; return; }
  if (file.size > MAX_SETTINGS_BACKUP_BYTES) { backupError.textContent = "Settings backup is too large."; return; }

  await withBusy(importSettingsButton, "Importing…", async () => {
    try {
      const backupText = await file.text();
      const result = await withInternalMutation(async () => unwrapOptionsImportResponse(
        await sendOptionsRuntimeMessage(api, { type: "drop-ads:import-settings", backupText }),
        "Could not import settings"
      ));
      importSettingsFile.value = "";
      await refreshCommittedView(
        render,
        backupError,
        "Settings were imported and activated, but Settings could not refresh the view."
      );
      const fetchSummary = result.fetchedSources > 0
        ? ` ${result.fetchedSources} enabled filter source${result.fetchedSources === 1 ? " was" : "s were"} fetched because no reusable local cache existed.`
        : " Existing local list cache was reusable; no additional source download was required for activation.";
      backupStatus.textContent = `Settings imported and activated locally.${fetchSummary}`;
    } catch (error) {
      backupError.textContent = optionsCaughtErrorMessage(error, "Could not import settings");
    }
  });
}

function ruleLabel(rule) { return rule.kind === "domain" ? `Domain · ${rule.value}` : `URL · ${rule.value}`; }

function makeButton(text, label, onClick, className = "remove") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function makeRemoveButton(label, onClick) { return makeButton("Remove", `Remove ${label}`, onClick); }

function emptyItem() {
  const empty = document.createElement("li");
  empty.className = "empty";
  empty.textContent = "None";
  return empty;
}

function focusAfterMutation(container, rowIndex, fallback) {
  const buttons = [...container.querySelectorAll("li .remove")];
  const target = buttons[Math.min(rowIndex, Math.max(0, buttons.length - 1))];
  if (target) target.focus(); else fallback?.focus();
}

function renderRuleList(container, rules, field, state) {
  const fragment = document.createDocumentFragment();
  if (!rules.length) {
    fragment.append(emptyItem());
    container.replaceChildren(fragment);
    return;
  }

  const conflictKeys = personalRuleConflictKeys(state.personalBlock, state.personalAllow);
  rules.forEach((rule, rowIndex) => {
    const item = document.createElement("li");
    const key = ruleKey(rule);
    item.dataset.ruleKey = key;

    const copy = document.createElement("div");
    copy.className = "rule-copy";
    const label = document.createElement("code");
    label.textContent = ruleLabel(rule);
    copy.append(label);

    if (field === "personalBlock" && conflictKeys.has(key)) {
      item.classList.add("overridden");
      const note = document.createElement("span");
      note.className = "rule-note";
      note.textContent = "Allowed by your personal allowlist — this block is currently overridden.";
      copy.append(note);
    }

    const controls = document.createElement("div");
    controls.className = "subscription-controls";

    if (field === "personalBlock" && (rule.kind === "domain" || rule.kind === "url")) {
      const submit = makeButton("Submit", `Prepare community submission for ${rule.value}`, () => prepareCommunitySubmission(rule, submit), "secondary-action");
      controls.append(submit);
    }

    if (field === "personalBlock" && conflictKeys.has(key)) {
      const clearOverride = makeButton("Remove allow", `Remove allow override for ${rule.value}`, async () => {
        allowError.textContent = "";
        await withBusy(clearOverride, "Removing…", async () => {
          try {
            await runtimePolicy({ type: "drop-ads:remove-personal-rule", field: "personalAllow", key }, "Could not remove allow override");
            await refreshCommittedView(
              refreshPersonalLists,
              allowError,
              "Allow override was removed and is active, but Settings could not refresh the personal rule lists."
            );
          } catch (error) {
            allowError.textContent = optionsCaughtErrorMessage(error, "Could not remove allow override");
          }
        });
      }, "secondary-action");
      controls.append(clearOverride);
    }

    const remove = makeRemoveButton(rule.value, async () => {
      const targetError = field === "personalBlock" ? blockError : allowError;
      targetError.textContent = "";
      await withBusy(remove, "Removing…", async () => {
        try {
          await runtimePolicy({ type: "drop-ads:remove-personal-rule", field, key }, "Could not remove rule");
          const refreshed = await refreshCommittedView(
            refreshPersonalLists,
            targetError,
            "Rule removal is active, but Settings could not refresh the personal rule lists."
          );
          if (refreshed) focusAfterMutation(container, rowIndex, field === "personalBlock" ? blockInput : allowInput);
        } catch (error) {
          targetError.textContent = optionsCaughtErrorMessage(error, "Could not remove rule");
        }
      });
    });
    controls.append(remove);
    item.append(copy, controls);
    fragment.append(item);
  });

  container.replaceChildren(fragment);
}

function renderDomainList(container, sites, removeFromField) {
  const fragment = document.createDocumentFragment();
  if (!sites.length) {
    fragment.append(emptyItem());
    container.replaceChildren(fragment);
    return;
  }

  sites.forEach((site, rowIndex) => {
    const item = document.createElement("li");
    const label = document.createElement("code");
    label.textContent = site;
    const remove = makeRemoveButton(site, async () => {
      const target = removeFromField === "disabledSites" ? allowError : cookieExceptionError;
      target.textContent = "";
      await withBusy(remove, "Removing…", async () => {
        try {
          if (removeFromField === "disabledSites") {
            await runtimePolicy({ type: "drop-ads:set-site-disabled", domain: site, disabled: false }, "Could not re-enable site protection");
          } else {
            await runtimePolicy({ type: "drop-ads:set-cookie-exception", domain: site, allowed: false }, "Could not remove cookie exception");
          }
          const refreshed = await refreshCommittedView(
            () => refreshDomainList(removeFromField),
            target,
            "Site policy change is active, but Settings could not refresh the site list."
          );
          if (refreshed) focusAfterMutation(container, rowIndex, removeFromField === "disabledSites" ? null : cookieExceptionInput);
        } catch (error) {
          target.textContent = optionsCaughtErrorMessage(error, "Could not update site policy");
        }
      });
    });
    item.append(label, remove);
    fragment.append(item);
  });
  container.replaceChildren(fragment);
}

function renderSubscriptions(container, subscriptions) {
  const fragment = document.createDocumentFragment();
  for (const subscription of subscriptions) {
    const item = document.createElement("li");
    item.className = "subscription-item";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = subscription.title;
    const url = document.createElement("code");
    url.textContent = subscription.sourceUrl;
    info.append(title, url);

    const controls = document.createElement("div");
    controls.className = "subscription-controls";
    const enabledLabel = document.createElement("label");
    enabledLabel.className = "inline-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = subscription.enabled;
    checkbox.addEventListener("change", async () => {
      const desired = checkbox.checked;
      checkbox.disabled = true;
      checkbox.setAttribute("aria-busy", "true");
      subscriptionError.textContent = "";
      try {
        await setSubscriptionEnabled(subscription, desired);
        await refreshCommittedView(
          refreshSubscriptions,
          subscriptionError,
          `Filter list was ${desired ? "enabled" : "disabled"}, but Settings could not refresh the subscription list.`
        );
      } catch (error) {
        checkbox.checked = !desired;
        subscriptionError.textContent = optionsCaughtErrorMessage(error, "Could not change filter list state");
      } finally {
        checkbox.removeAttribute("aria-busy");
        checkbox.disabled = false;
      }
    });
    enabledLabel.append(checkbox, document.createTextNode("Enabled"));
    controls.append(enabledLabel);

    if (!subscription.builtIn) {
      const removeButton = makeRemoveButton(subscription.title, async () => {
        subscriptionError.textContent = "";
        await withBusy(removeButton, "Removing…", async () => {
          try {
            await removeSubscription(subscription);
            await refreshCommittedView(
              refreshSubscriptions,
              subscriptionError,
              "Filter list was removed, but Settings could not refresh the subscription list."
            );
          } catch (error) {
            subscriptionError.textContent = optionsCaughtErrorMessage(error, "Could not remove filter list");
          }
        });
      });
      controls.append(removeButton);
    }

    item.append(info, controls);
    fragment.append(item);
  }
  container.replaceChildren(fragment);
}

async function refreshPersonalLists() {
  const state = await loadState(api);
  if (!pageActive) return false;
  renderRuleList(blockList, state.personalBlock, "personalBlock", state);
  renderRuleList(allowList, state.personalAllow, "personalAllow", state);
  return true;
}

async function refreshDomainList(field) {
  const state = await loadState(api);
  if (!pageActive) return false;
  if (field === "disabledSites") renderDomainList(disabledSites, state.disabledSites, field);
  else renderDomainList(cookieExceptionList, state.cookieAllowSites, field);
  return true;
}

async function refreshSubscriptions() {
  const state = await loadState(api);
  if (!pageActive) return false;
  renderSubscriptions(subscriptionList, state.subscriptions);
  return true;
}

async function render() {
  const state = await loadState(api);
  if (!pageActive) return false;
  autoSubmit.checked = state.autoSubmitCommunity;
  cookieMode.value = state.cookieMode;
  lastCommittedCookieMode = state.cookieMode;
  renderRuleList(blockList, state.personalBlock, "personalBlock", state);
  renderRuleList(allowList, state.personalAllow, "personalAllow", state);
  renderDomainList(disabledSites, state.disabledSites, "disabledSites");
  renderDomainList(cookieExceptionList, state.cookieAllowSites, "cookieAllowSites");
  renderSubscriptions(subscriptionList, state.subscriptions);
  return true;
}
