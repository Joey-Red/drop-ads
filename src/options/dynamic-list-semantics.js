import "./policy-row-semantics.js";
import "./mutation-target-semantics.js";
import "./subscription-presentation.js";

const subscriptionList = document.querySelector("#subscription-list");
const subscriptionUrlInput = document.querySelector("#subscription-url");
const personalBlockList = document.querySelector("#block-list");
const personalAllowList = document.querySelector("#allow-list");
const personalBlockInput = document.querySelector("#block-input");
let subscriptionRowObserver = null;
let personalBlockObserver = null;
let personalAllowObserver = null;
let pendingToggleSource = null;
let pendingRemoveIndex = null;
let pendingOverrideRuleKey = null;

function sourceTextForRow(row) {
  return row?.querySelector("code")?.textContent?.trim() ?? "";
}

function appendDescription(control, ...ids) {
  if (!control) return;
  const tokens = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  for (const id of ids) if (id) tokens.add(id);
  if (tokens.size) control.setAttribute("aria-describedby", [...tokens].join(" "));
}

function subscriptionRows() {
  return subscriptionList ? [...subscriptionList.querySelectorAll("li.subscription-item")] : [];
}

function enhanceSubscriptionRows() {
  const rows = subscriptionRows();
  rows.forEach((row, index) => {
    const title = row.querySelector("strong");
    const source = row.querySelector("code");
    const controls = row.querySelector(".subscription-controls");
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!title || !source || !controls || !checkbox) return;

    const titleText = title.textContent?.trim() ?? "";
    const titleId = `subscription-title-${index + 1}`;
    const sourceId = `subscription-source-${index + 1}`;
    title.id = titleId;
    source.id = sourceId;
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-labelledby", titleId);
    controls.setAttribute("aria-describedby", `${sourceId} refresh-status subscription-error`);
    checkbox.removeAttribute("aria-label");
    checkbox.setAttribute("aria-labelledby", titleId);
    checkbox.setAttribute("aria-describedby", `${sourceId} refresh-status subscription-error`);

    const remove = controls.querySelector("button.remove");
    if (remove && titleText) {
      if (remove.textContent !== "Remove list") remove.textContent = "Remove list";
      remove.setAttribute("aria-label", `Remove filter list ${titleText}`);
      remove.setAttribute("aria-describedby", `${sourceId} refresh-status subscription-error`);
    }
  });
}

function enhancePersonalRuleRows(list, prefix) {
  if (!list) return;
  const rows = [...list.querySelectorAll("li[data-rule-key]")];
  rows.forEach((row, index) => {
    const label = row.querySelector(".rule-copy > code");
    const controls = row.querySelector(".subscription-controls");
    if (!label || !controls) return;
    const labelText = label.textContent?.trim() ?? "";
    const labelId = `${prefix}-rule-label-${index + 1}`;
    label.id = labelId;
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-labelledby", labelId);

    const remove = controls.querySelector("button.remove");
    if (remove && labelText) {
      if (remove.textContent !== "Remove rule") remove.textContent = "Remove rule";
      remove.setAttribute("aria-label", `Remove ${labelText}`);
      appendDescription(remove, prefix === "block" ? "block-help" : "allow-help", prefix === "block" ? "block-error" : "allow-error");
    }

    if (prefix === "block") {
      for (const action of controls.querySelectorAll("button.secondary-action")) {
        if (action.textContent === "Submit") {
          action.textContent = "Prepare submission";
          action.setAttribute("aria-label", labelText ? `Prepare community submission for ${labelText}` : "Prepare community submission");
          appendDescription(action, "block-help", "community-help", "block-error");
        } else if (action.textContent === "Remove allow") {
          action.textContent = "Remove allow override";
          action.setAttribute("aria-label", labelText ? `Remove allow override for ${labelText}` : "Remove allow override");
          appendDescription(action, "allow-help", "allow-error");
        }
      }
    }

    const notes = [...row.querySelectorAll(".rule-copy > .rule-note")];
    const noteIds = [];
    notes.forEach((note, noteIndex) => {
      const noteId = `${prefix}-rule-note-${index + 1}-${noteIndex + 1}`;
      note.id = noteId;
      noteIds.push(noteId);
    });
    if (noteIds.length) controls.setAttribute("aria-describedby", noteIds.join(" "));
    else controls.removeAttribute("aria-describedby");
  });
}

function enhancePersonalRules() {
  enhancePersonalRuleRows(personalBlockList, "block");
  enhancePersonalRuleRows(personalAllowList, "allow");
}

function handlePersonalBlockClick(event) {
  const action = event.target?.closest?.("button.secondary-action");
  if (!action || !personalBlockList?.contains(action) || action.textContent !== "Remove allow override") return;
  const key = action.closest("li[data-rule-key]")?.dataset.ruleKey;
  if (key) pendingOverrideRuleKey = key;
}

function restoreOverrideFocus() {
  if (!pendingOverrideRuleKey || !personalBlockList) return;
  const key = pendingOverrideRuleKey;
  pendingOverrideRuleKey = null;
  const row = [...personalBlockList.querySelectorAll("li[data-rule-key]")].find((candidate) => candidate.dataset.ruleKey === key);
  const target = row?.querySelector("button.secondary-action, button.remove");
  if (target) target.focus();
  else personalBlockInput?.focus();
}

function handlePersonalBlockMutations(mutations) {
  enhancePersonalRuleRows(personalBlockList, "block");
  const hasChildListChange = mutations.some((mutation) => mutation.type === "childList");
  if (pendingOverrideRuleKey && hasChildListChange) restoreOverrideFocus();

  for (const mutation of mutations) {
    if (mutation.type !== "attributes" || mutation.attributeName !== "disabled") continue;
    const control = mutation.target;
    if (!(control instanceof Element) || control.disabled || !personalBlockList?.contains(control)) continue;
    if (control.matches?.("button.secondary-action") !== true || control.textContent !== "Remove allow override") continue;
    const key = control.closest("li[data-rule-key]")?.dataset.ruleKey;
    if (key && key === pendingOverrideRuleKey) pendingOverrideRuleKey = null;
  }
}

function handleSubscriptionChange(event) {
  const checkbox = event.target?.closest?.('input[type="checkbox"]');
  if (!checkbox || !subscriptionList?.contains(checkbox)) return;
  const source = sourceTextForRow(checkbox.closest("li.subscription-item"));
  if (source) pendingToggleSource = source;
}

function handleSubscriptionClick(event) {
  const action = event.target?.closest?.("button.remove");
  if (!action || !subscriptionList?.contains(action)) return;
  const row = action.closest("li.subscription-item");
  const index = subscriptionRows().indexOf(row);
  if (index >= 0) pendingRemoveIndex = index;
}

function findSubscriptionRowBySource(source) {
  if (!source) return null;
  return subscriptionRows().find((row) => sourceTextForRow(row) === source) ?? null;
}

function restoreRemovedSubscriptionFocus() {
  if (pendingRemoveIndex == null) return;
  const rows = subscriptionRows();
  const index = pendingRemoveIndex;
  pendingRemoveIndex = null;
  if (!rows.length) {
    subscriptionUrlInput?.focus();
    return;
  }
  const row = rows[Math.min(index, rows.length - 1)];
  const target = row?.querySelector('input[type="checkbox"], button.remove');
  target?.focus();
}

function handleSubscriptionMutations(mutations) {
  enhanceSubscriptionRows();
  const hasChildListChange = mutations.some((mutation) => mutation.type === "childList");

  if (pendingRemoveIndex != null && hasChildListChange) restoreRemovedSubscriptionFocus();

  if (pendingToggleSource) {
    const replacement = findSubscriptionRowBySource(pendingToggleSource);
    if (hasChildListChange && replacement) {
      const checkbox = replacement.querySelector('input[type="checkbox"]');
      pendingToggleSource = null;
      checkbox?.focus();
    }
  }

  for (const mutation of mutations) {
    if (mutation.type !== "attributes" || mutation.attributeName !== "disabled") continue;
    const control = mutation.target;
    if (!(control instanceof Element) || control.disabled || !subscriptionList?.contains(control)) continue;

    if (control.matches?.('input[type="checkbox"]') === true && pendingToggleSource) {
      if (sourceTextForRow(control.closest("li.subscription-item")) === pendingToggleSource) pendingToggleSource = null;
    }
    if (control.matches?.("button.remove") === true && pendingRemoveIndex != null) pendingRemoveIndex = null;
  }
}

enhanceSubscriptionRows();
if (subscriptionList && typeof globalThis.MutationObserver === "function") {
  subscriptionList.addEventListener("change", handleSubscriptionChange, true);
  subscriptionList.addEventListener("click", handleSubscriptionClick, true);
  subscriptionRowObserver = new globalThis.MutationObserver(handleSubscriptionMutations);
  subscriptionRowObserver.observe(subscriptionList, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
}

enhancePersonalRules();
if (typeof globalThis.MutationObserver === "function") {
  if (personalBlockList) {
    personalBlockList.addEventListener("click", handlePersonalBlockClick, true);
    personalBlockObserver = new globalThis.MutationObserver(handlePersonalBlockMutations);
    personalBlockObserver.observe(personalBlockList, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
  }
  if (personalAllowList) {
    personalAllowObserver = new globalThis.MutationObserver(() => enhancePersonalRuleRows(personalAllowList, "allow"));
    personalAllowObserver.observe(personalAllowList, { childList: true, subtree: true });
  }
}

window.addEventListener("pagehide", () => {
  try { subscriptionRowObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  subscriptionRowObserver = null;
  try { personalBlockObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  personalBlockObserver = null;
  try { personalAllowObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  personalAllowObserver = null;
  subscriptionList?.removeEventListener("change", handleSubscriptionChange, true);
  subscriptionList?.removeEventListener("click", handleSubscriptionClick, true);
  personalBlockList?.removeEventListener("click", handlePersonalBlockClick, true);
  pendingToggleSource = null;
  pendingRemoveIndex = null;
  pendingOverrideRuleKey = null;
}, { once: true });
