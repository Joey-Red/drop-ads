import { normalizeCosmeticRule, cosmeticRuleKey } from "../core/cosmetic-rules.js";
import { isRelevantOptionsStorageChange, optionsCaughtErrorMessage, unwrapOptionsRuntimeResponse } from "../core/options-boundary.js";
import { sendOptionsRuntimeMessage } from "../core/options-runtime.js";
import { installOwnedOptionsStorageListener } from "../core/options-storage-listener.js";
import { normalizeDomain } from "../core/rules.js";
import { loadState, STORAGE_KEY } from "../core/storage.js";

const api = globalThis.browser ?? globalThis.chrome;
const hideForm = document.querySelector("#cosmetic-hide-form");
const hideDomain = document.querySelector("#cosmetic-hide-domain");
const hideSelector = document.querySelector("#cosmetic-hide-selector");
const hideError = document.querySelector("#cosmetic-hide-error");
const hideList = document.querySelector("#cosmetic-hide-list");
const allowForm = document.querySelector("#cosmetic-allow-form");
const allowDomain = document.querySelector("#cosmetic-allow-domain");
const allowSelector = document.querySelector("#cosmetic-allow-selector");
const allowError = document.querySelector("#cosmetic-allow-error");
const allowList = document.querySelector("#cosmetic-allow-list");
const hideSubmit = hideForm.querySelector('button[type="submit"]');
const allowSubmit = allowForm.querySelector('button[type="submit"]');
let internalMutationDepth = 0;
let renderQueued = false;
let renderGeneration = 0;
let pageActive = true;
let disposeStorageLiveSync = null;

window.addEventListener("pagehide", () => {
  pageActive = false;
  renderGeneration += 1;
  renderQueued = false;
  try { disposeStorageLiveSync?.(); } catch { }
  disposeStorageLiveSync = null;
}, { once: true });

function scopedRule(domainInput, selectorInput) {
  const selector = selectorInput.value;
  const domainText = domainInput.value.trim();
  return normalizeCosmeticRule({ selector, ...(domainText ? { domains: [normalizeDomain(domainText)] } : {}) });
}

function scopeLabel(rule) {
  const domains = rule.domains ?? [];
  const excluded = rule.excludedDomains ?? [];
  if (!domains.length && !excluded.length) return "All sites";
  const include = domains.length ? domains.join(", ") : "All sites";
  return excluded.length ? `${include}; except ${excluded.join(", ")}` : include;
}

async function withBusy(control, busyText, task, owner) {
  const original = control.textContent;
  control.disabled = true;
  owner.setAttribute("aria-busy", "true");
  control.textContent = busyText;
  try { return await task(); }
  finally {
    control.textContent = original;
    owner.removeAttribute("aria-busy");
    control.disabled = false;
  }
}

async function cosmeticMutation(message, fallback) {
  internalMutationDepth += 1;
  try {
    const response = await sendOptionsRuntimeMessage(api, message);
    return unwrapOptionsRuntimeResponse(response, fallback);
  } finally {
    internalMutationDepth -= 1;
  }
}

function emptyItem() {
  const item = document.createElement("li");
  item.className = "empty";
  item.textContent = "None";
  return item;
}

function focusAfterRemoval(container, index, fallback) {
  const buttons = [...container.querySelectorAll("button.remove")];
  const target = buttons[Math.min(index, Math.max(0, buttons.length - 1))];
  if (target) target.focus(); else fallback.focus();
}

function renderList(container, rules, field, errorNode, fallback) {
  const fragment = document.createDocumentFragment();
  if (!rules.length) {
    fragment.append(emptyItem());
    container.replaceChildren(fragment);
    return;
  }
  rules.forEach((rule, index) => {
    const item = document.createElement("li");
    const copy = document.createElement("div");
    copy.className = "rule-copy";
    const selector = document.createElement("code");
    selector.textContent = rule.selector;
    const note = document.createElement("span");
    note.className = "rule-note";
    const scope = scopeLabel(rule);
    note.textContent = scope;
    copy.append(selector, note);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove cosmetic rule";
    remove.setAttribute("aria-label", `Remove cosmetic rule ${rule.selector} on ${scope}`);
    remove.addEventListener("click", async () => {
      errorNode.textContent = "";
      await withBusy(remove, "Removing…", async () => {
        try {
          await cosmeticMutation({ type: "drop-ads:remove-cosmetic-rule", field, key: cosmeticRuleKey(rule) }, "Could not remove cosmetic rule");
          const rendered = await renderSafely(errorNode, "Cosmetic rule was removed, but Settings could not refresh");
          if (rendered) focusAfterRemoval(container, index, fallback);
        } catch (error) {
          errorNode.textContent = optionsCaughtErrorMessage(error, "Could not remove cosmetic rule");
          await renderSafely(errorNode, "Could not refresh cosmetic settings", true);
        }
      }, item);
    });
    item.append(copy, remove);
    fragment.append(item);
  });
  container.replaceChildren(fragment);
}

async function addRule(event, { field, domainInput, selectorInput, errorNode, submit, form }) {
  event.preventDefault();
  errorNode.textContent = "";
  await withBusy(submit, "Adding…", async () => {
    try {
      const rule = scopedRule(domainInput, selectorInput);
      await cosmeticMutation({ type: "drop-ads:add-cosmetic-rule", field, rule }, "Could not add cosmetic rule");
      selectorInput.value = "";
      const rendered = await renderSafely(errorNode, "Cosmetic rule was added, but Settings could not refresh");
      if (rendered) selectorInput.focus();
    } catch (error) {
      errorNode.textContent = optionsCaughtErrorMessage(error, "Could not add cosmetic rule");
      await renderSafely(errorNode, "Could not refresh cosmetic settings", true);
    }
  }, form);
}

async function renderSafely(errorNode, fallback, preserveError = false) {
  if (!pageActive) return false;
  try { return await render(); }
  catch (error) {
    if (pageActive && !preserveError) errorNode.textContent = optionsCaughtErrorMessage(error, fallback);
    return false;
  }
}

async function render() {
  const generation = ++renderGeneration;
  const state = await loadState(api);
  if (!pageActive || generation !== renderGeneration) return false;
  renderList(hideList, state.personalCosmeticHide, "personalCosmeticHide", hideError, hideSelector);
  renderList(allowList, state.personalCosmeticAllow, "personalCosmeticAllow", allowError, allowSelector);
  return true;
}

function runQueuedRender() {
  renderQueued = false;
  if (!pageActive) return;
  void renderSafely(hideError, "Could not refresh cosmetic settings");
}

function queueRender() {
  if (!pageActive || renderQueued) return;
  renderQueued = true;
  try { queueMicrotask(runQueuedRender); }
  catch { runQueuedRender(); }
}

function installStorageLiveSync() {
  try {
    disposeStorageLiveSync = installOwnedOptionsStorageListener(api, (changes, areaName) => {
      if (isRelevantOptionsStorageChange(changes, areaName, STORAGE_KEY) && internalMutationDepth === 0) queueRender();
    });
    return true;
  } catch {
    disposeStorageLiveSync = null;
    hideError.textContent = optionsCaughtErrorMessage(null, "Automatic cosmetic Settings synchronization is unavailable; direct changes still work.");
    return false;
  }
}

hideForm.addEventListener("submit", (event) => addRule(event, { field: "personalCosmeticHide", domainInput: hideDomain, selectorInput: hideSelector, errorNode: hideError, submit: hideSubmit, form: hideForm }));
allowForm.addEventListener("submit", (event) => addRule(event, { field: "personalCosmeticAllow", domainInput: allowDomain, selectorInput: allowSelector, errorNode: allowError, submit: allowSubmit, form: allowForm }));
installStorageLiveSync();
await renderSafely(hideError, "Could not load cosmetic settings");
