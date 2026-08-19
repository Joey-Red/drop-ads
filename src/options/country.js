import "./action-count.js";
import { COUNTRY_PRESETS, collectCountryRules, countryRuleLabel, makeCountryRule, normalizeCountryMode, normalizeCountryTld } from "../core/country-policy.js";
import { isRelevantOptionsStorageChange, optionsCaughtErrorMessage, unwrapOptionsRuntimeResponse } from "../core/options-boundary.js";
import { sendOptionsRuntimeMessage } from "../core/options-runtime.js";
import { installOwnedOptionsStorageListener } from "../core/options-storage-listener.js";
import { ruleKey } from "../core/rules.js";
import { loadState, STORAGE_KEY } from "../core/storage.js";

const api = globalThis.browser ?? globalThis.chrome;
const form = document.querySelector("#country-form");
const preset = document.querySelector("#country-preset");
const custom = document.querySelector("#country-custom-tld");
const mode = document.querySelector("#country-mode");
const submit = document.querySelector("#country-submit");
const list = document.querySelector("#country-list");
const status = document.querySelector("#country-status");
const blockList = document.querySelector("#block-list");

if (form && preset && custom && mode && submit && list && status) {
  const displayNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
  let latestState = null;
  let renderQueued = false;
  let renderGeneration = 0;
  let personalListObserver = null;
  let relabelQueued = false;
  let pageActive = true;
  let disposeStorageLiveSync = null;

  populatePresets();
  await renderSafely("Could not load country settings");
  form.addEventListener("submit", addCountryBlock);
  installStorageLiveSync();

  if (blockList) {
    personalListObserver = new MutationObserver(() => schedulePersonalListRelabel());
    personalListObserver.observe(blockList, { childList: true, subtree: true });
  }

  window.addEventListener("pagehide", () => {
    pageActive = false;
    renderGeneration += 1;
    renderQueued = false;
    relabelQueued = false;
    try { disposeStorageLiveSync?.(); } catch { }
    disposeStorageLiveSync = null;
    try { personalListObserver?.disconnect(); } catch { }
    personalListObserver = null;
  }, { once: true });

  function regionName(region) {
    try { return displayNames?.of(region) || region; } catch { return region; }
  }

  function populatePresets() {
    const fragment = document.createDocumentFragment();
    for (const item of COUNTRY_PRESETS) {
      const option = document.createElement("option");
      option.value = item.tld;
      option.textContent = `${regionName(item.region)} (.${item.tld})`;
      fragment.append(option);
    }
    preset.append(fragment);
  }

  async function runtimePolicy(message, fallback) {
    const response = await sendOptionsRuntimeMessage(api, message);
    return unwrapOptionsRuntimeResponse(response, fallback);
  }

  async function addRule(rule) {
    return runtimePolicy({ type: "drop-ads:add-personal-rule", field: "personalBlock", rule }, "Could not add country rule");
  }

  async function removeRule(key) {
    return runtimePolicy({ type: "drop-ads:remove-personal-rule", field: "personalBlock", key }, "Could not remove country rule");
  }

  function desiredTld() {
    return normalizeCountryTld(custom.value.trim() || preset.value);
  }

  function focusCountryMode(tld) {
    for (const candidate of list.querySelectorAll("select[data-country-tld]")) {
      if (candidate.dataset.countryTld === tld) {
        candidate.focus();
        return true;
      }
    }
    return false;
  }

  function restoreCountryModeFocus(tld) {
    if (!focusCountryMode(tld)) preset.focus();
  }

  async function addCountryBlock(event) {
    event.preventDefault();
    status.textContent = "";
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      const tld = desiredTld();
      const desiredMode = normalizeCountryMode(mode.value);
      await replaceCountryRule(tld, desiredMode);
      custom.value = "";
      preset.value = "";
      status.textContent = `.${tld} blocking is active (${desiredMode === "all" ? "all resources" : "navigation only"}). Country rules stay local and are never valid community-list submissions.`;
      const rendered = await renderSafely("Country blocking changed, but Settings could not refresh");
      if (rendered) preset.focus();
    } catch (error) {
      status.textContent = optionsCaughtErrorMessage(error, "Could not change country blocking");
      await renderSafely("Could not refresh country settings", true);
    } finally {
      form.removeAttribute("aria-busy");
      submit.disabled = false;
    }
  }

  async function replaceCountryRule(tld, desiredMode) {
    const state = await loadState(api);
    const existing = collectCountryRules(state.personalBlock).find((item) => item.tld === tld);
    const desired = makeCountryRule(tld, desiredMode);
    const desiredKey = ruleKey(desired);
    if (!existing?.rules.some((item) => item.key === desiredKey)) await addRule(desired);
    for (const old of existing?.rules ?? []) if (old.key !== desiredKey) await removeRule(old.key);
  }

  async function removeCountryBlock(item, button, rowIndex) {
    const row = button.closest("li");
    status.textContent = "";
    button.disabled = true;
    row?.setAttribute("aria-busy", "true");
    try {
      for (const parsed of item.rules) await removeRule(parsed.key);
      status.textContent = `.${item.tld} country blocking removed.`;
      const rendered = await renderSafely("Country blocking was removed, but Settings could not refresh");
      if (rendered) {
        const nextButtons = [...list.querySelectorAll("button.remove")];
        (nextButtons[Math.min(rowIndex, Math.max(0, nextButtons.length - 1))] ?? preset).focus();
      }
    } catch (error) {
      status.textContent = optionsCaughtErrorMessage(error, "Could not remove country rule");
      const rendered = await renderSafely("Could not refresh country settings", true);
      if (rendered) restoreCountryModeFocus(item.tld);
    } finally {
      if (row?.isConnected) row.removeAttribute("aria-busy");
      if (button.isConnected) button.disabled = false;
    }
  }

  async function changeCountryMode(item, select) {
    const row = select.closest("li");
    const desiredMode = normalizeCountryMode(select.value);
    select.disabled = true;
    row?.setAttribute("aria-busy", "true");
    status.textContent = "Applying country mode…";
    try {
      await replaceCountryRule(item.tld, desiredMode);
      status.textContent = `.${item.tld} now blocks ${desiredMode === "all" ? "all resources" : "navigation only"}.`;
      const rendered = await renderSafely("Country mode changed, but Settings could not refresh");
      if (rendered) restoreCountryModeFocus(item.tld);
    } catch (error) {
      status.textContent = optionsCaughtErrorMessage(error, "Could not change country mode");
      const rendered = await renderSafely("Could not refresh country settings", true);
      if (rendered) restoreCountryModeFocus(item.tld);
    } finally {
      if (row?.isConnected) row.removeAttribute("aria-busy");
      if (select.isConnected) select.disabled = false;
    }
  }

  async function renderSafely(fallback, preserveStatus = false) {
    if (!pageActive) return false;
    try { return await render(); }
    catch (error) {
      if (pageActive && !preserveStatus) status.textContent = optionsCaughtErrorMessage(error, fallback);
      return false;
    }
  }

  function runQueuedRender() {
    renderQueued = false;
    if (!pageActive) return;
    void renderSafely("Could not refresh country settings");
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
        if (isRelevantOptionsStorageChange(changes, areaName, STORAGE_KEY)) queueRender();
      });
      return true;
    } catch {
      disposeStorageLiveSync = null;
      status.textContent = optionsCaughtErrorMessage(null, "Automatic country Settings synchronization is unavailable; direct changes still work.");
      return false;
    }
  }

  function runPersonalListRelabel() {
    relabelQueued = false;
    if (!pageActive) return;
    relabelPersonalList();
  }

  function schedulePersonalListRelabel() {
    if (!pageActive || relabelQueued) return;
    relabelQueued = true;
    try { queueMicrotask(runPersonalListRelabel); }
    catch { runPersonalListRelabel(); }
  }

  async function render() {
    const generation = ++renderGeneration;
    const state = await loadState(api);
    if (!pageActive || generation !== renderGeneration) return false;
    latestState = state;
    const countries = collectCountryRules(latestState.personalBlock);
    const fragment = document.createDocumentFragment();
    if (!countries.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No country-code TLD blocks configured";
      fragment.append(empty);
    }
    countries.forEach((item, rowIndex) => {
      const row = document.createElement("li");
      const copy = document.createElement("div");
      copy.className = "rule-copy";
      const label = document.createElement("code");
      label.textContent = `.${item.tld}`;
      const note = document.createElement("span");
      note.className = "rule-note";
      note.textContent = item.mode === "all" ? "Blocks navigation and subresources" : "Blocks top-level navigation only";
      copy.append(label, note);
      const controls = document.createElement("div");
      controls.className = "subscription-controls";
      const select = document.createElement("select");
      select.dataset.countryTld = item.tld;
      select.setAttribute("aria-label", `Blocking mode for .${item.tld}`);
      select.setAttribute("aria-describedby", "country-status");
      select.innerHTML = '<option value="navigation">Navigation only</option><option value="all">All resources</option>';
      select.value = item.mode;
      select.addEventListener("change", () => void changeCountryMode(item, select));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "Remove TLD block";
      remove.setAttribute("aria-label", `Remove .${item.tld} country block`);
      remove.addEventListener("click", () => void removeCountryBlock(item, remove, rowIndex));
      controls.append(select, remove);
      row.append(copy, controls);
      fragment.append(row);
    });
    list.replaceChildren(fragment);
    schedulePersonalListRelabel();
    return true;
  }

  function relabelPersonalList() {
    if (!pageActive || !latestState || !blockList) return;
    const labels = new Map();
    for (const item of collectCountryRules(latestState.personalBlock)) for (const parsed of item.rules) labels.set(parsed.key, countryRuleLabel(parsed));
    for (const row of blockList.querySelectorAll("li[data-rule-key]")) {
      const text = labels.get(row.dataset.ruleKey);
      if (!text) continue;
      const code = row.querySelector("code");
      if (code) code.textContent = text;
      const copy = row.querySelector(".rule-copy");
      if (copy && !copy.querySelector(".country-rule-note")) {
        const note = document.createElement("span");
        note.className = "rule-note country-rule-note";
        note.textContent = "Managed by Country / region TLD blocking below.";
        copy.append(note);
      }
    }
  }
}
