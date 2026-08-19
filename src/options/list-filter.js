import "./mutation-target-semantics.js";
import "./disabled-site-feedback.js";
import "./subscription-presentation.js";

const FILTER_QUERY_LIMIT = 256;
const FILTER_PRIVACY_TEXT = "Filters only this Settings page and is not saved. From a filtered row, press Escape to return to this filter.";

const filterSpecs = [
  { listId: "block-list", label: "Filter personal block rules" },
  { listId: "allow-list", label: "Filter personal allow rules" },
  { listId: "disabled-sites", label: "Filter disabled sites" },
  { listId: "session-pauses-list", label: "Filter temporary session pauses" },
  { listId: "cookie-exception-list", label: "Filter cookie exceptions" },
  { listId: "subscription-list", label: "Filter configured filter lists" },
  { listId: "country-list", label: "Filter country TLD rules" },
  { listId: "cosmetic-hide-list", label: "Filter cosmetic hide rules" },
  { listId: "cosmetic-allow-list", label: "Filter cosmetic exceptions" }
];

const controllers = [];
let pageActive = true;

function normalizedQuery(value) {
  const text = typeof value === "string" ? value : "";
  return text.slice(0, FILTER_QUERY_LIMIT).trim().toLowerCase();
}

function isSyntheticPresentationRow(row) {
  return row?.classList?.contains("list-filter-no-match") === true;
}

function rowIdentityNode(row) {
  if (!row) return null;
  const ruleCopy = row.querySelector?.(".rule-copy");
  if (ruleCopy) return ruleCopy;
  if (row.classList?.contains("subscription-item")) {
    for (const child of row.children ?? []) {
      if (!child.classList?.contains("subscription-controls")) return child;
    }
  }
  return row.querySelector?.("code, strong") ?? row;
}

function rowSearchText(row) {
  return (rowIdentityNode(row)?.textContent ?? "").toLowerCase();
}

function filterStatus(query, hasEntries, hasMatches) {
  if (!hasEntries) return "No entries";
  if (!query) return "";
  return hasMatches ? "Filter active" : "No matching entries";
}

function updateNoMatchRow(controller, query, hasEntries, hasMatches) {
  const existing = [...controller.list.children].find(isSyntheticPresentationRow) ?? null;
  const shouldShow = Boolean(query && hasEntries && !hasMatches);
  if (!shouldShow) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.hidden = false;
    return;
  }
  const row = document.createElement("li");
  row.className = "list-filter-no-match";
  row.setAttribute("aria-hidden", "true");
  row.textContent = "No matching entries";
  controller.list.append(row);
}

function applyFilter(controller) {
  if (!pageActive) return;
  const query = normalizedQuery(controller.input.value);
  if (controller.input.value.length > FILTER_QUERY_LIMIT) controller.input.value = controller.input.value.slice(0, FILTER_QUERY_LIMIT);
  let hasEntries = false;
  let hasMatches = false;
  for (const row of controller.list.children) {
    if (!(row instanceof HTMLElement)) continue;
    if (isSyntheticPresentationRow(row)) continue;
    if (row.classList.contains("empty")) {
      row.hidden = false;
      continue;
    }
    hasEntries = true;
    const matches = !query || rowSearchText(row).includes(query);
    row.hidden = !matches;
    if (matches) hasMatches = true;
  }
  controller.clear.disabled = !controller.input.value;
  const nextStatus = filterStatus(query, hasEntries, hasMatches);
  if (controller.status.textContent !== nextStatus) controller.status.textContent = nextStatus;
  updateNoMatchRow(controller, query, hasEntries, hasMatches);
}

function visibleRows(controller) {
  return [...controller.list.children].filter((row) => row instanceof HTMLElement && !row.hidden && !row.classList.contains("empty") && !isSyntheticPresentationRow(row));
}

function firstEnabledControl(row) {
  return row?.querySelector?.('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? null;
}

function focusFirstVisibleRowControl(controller) {
  for (const row of visibleRows(controller)) {
    const target = firstEnabledControl(row);
    if (!target || typeof target.focus !== "function") continue;
    target.focus();
    return true;
  }
  return false;
}

function rememberFilteredMutationFocus(controller, event) {
  if (!normalizedQuery(controller.input.value)) return;
  const action = event.target?.closest?.("button.remove, button.secondary-action");
  if (!action || !controller.list.contains(action) || action.disabled) return;
  if (action.matches("button.secondary-action") && action.textContent?.trim() !== "Remove allow override") return;
  const row = action.closest("li");
  if (!row || row.hidden || isSyntheticPresentationRow(row)) return;
  const rows = visibleRows(controller);
  const index = rows.indexOf(row);
  if (index < 0) return;
  controller.pendingMutationFocus = { index, control: action };
}

function restoreFilteredMutationFocus(controller) {
  const pending = controller.pendingMutationFocus;
  if (!pending || pending.control?.isConnected) return;
  controller.pendingMutationFocus = null;
  const rows = visibleRows(controller);
  if (!rows.length) {
    controller.input.focus();
    return;
  }
  const row = rows[Math.min(pending.index, rows.length - 1)];
  const target = firstEnabledControl(row);
  if (target && typeof target.focus === "function") target.focus();
  else controller.input.focus();
}

function runPendingListMutationWork(controller) {
  controller.mutationQueued = false;
  const presentationChanged = controller.pendingPresentationChange;
  const pendingControlReenabled = controller.pendingControlReenabled;
  controller.pendingPresentationChange = false;
  controller.pendingControlReenabled = false;
  if (!pageActive) return;

  if (presentationChanged) {
    applyFilter(controller);
    restoreFilteredMutationFocus(controller);
  }

  const pending = controller.pendingMutationFocus;
  if (pending?.control?.isConnected && pendingControlReenabled && !pending.control.disabled) {
    controller.pendingMutationFocus = null;
  }
}

function scheduleListMutationWork(controller) {
  if (!pageActive || controller.mutationQueued) return;
  controller.mutationQueued = true;
  try {
    queueMicrotask(() => runPendingListMutationWork(controller));
  } catch {
    runPendingListMutationWork(controller);
  }
}

function handleListMutations(controller, mutations) {
  for (const mutation of mutations) {
    if (mutation.type === "childList" || mutation.type === "characterData") {
      controller.pendingPresentationChange = true;
      continue;
    }
    if (mutation.type !== "attributes" || mutation.attributeName !== "disabled") continue;
    const pending = controller.pendingMutationFocus;
    if (pending?.control === mutation.target && !pending.control.disabled) controller.pendingControlReenabled = true;
  }
  scheduleListMutationWork(controller);
}

function installFilter(spec) {
  const list = document.getElementById(spec.listId);
  if (!list?.parentElement) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "list-filter";
  wrapper.setAttribute("role", "search");
  wrapper.setAttribute("aria-controls", spec.listId);

  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "search";
  input.maxLength = FILTER_QUERY_LIMIT;
  input.autocomplete = "off";
  input.autocapitalize = "none";
  input.autocorrect = "off";
  input.spellcheck = false;
  input.inputMode = "search";
  input.enterKeyHint = "search";
  input.id = `${spec.listId}-filter`;
  input.setAttribute("aria-controls", spec.listId);
  input.setAttribute("aria-keyshortcuts", "Escape ArrowDown");
  input.placeholder = "Filter this list";
  label.id = `${spec.listId}-filter-label`;
  label.htmlFor = input.id;
  label.textContent = spec.label;
  wrapper.setAttribute("aria-labelledby", label.id);

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "list-filter-clear";
  clear.textContent = "Clear";
  clear.setAttribute("aria-label", `Clear ${spec.label.toLowerCase()}`);
  clear.setAttribute("aria-controls", spec.listId);

  const status = document.createElement("p");
  status.id = `${spec.listId}-filter-status`;
  status.className = "hint list-filter-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  const privacy = document.createElement("p");
  privacy.id = `${spec.listId}-filter-privacy`;
  privacy.className = "hint list-filter-privacy";
  privacy.textContent = FILTER_PRIVACY_TEXT;
  input.setAttribute("aria-describedby", `${status.id} ${privacy.id}`);
  clear.setAttribute("aria-describedby", `${status.id} ${privacy.id}`);

  wrapper.append(label, input, clear, status, privacy);
  list.before(wrapper);

  const controller = {
    list,
    input,
    clear,
    status,
    observer: null,
    pendingMutationFocus: null,
    mutationQueued: false,
    pendingPresentationChange: false,
    pendingControlReenabled: false
  };
  const clearFilter = () => {
    if (!input.value) return;
    input.value = "";
    controller.pendingMutationFocus = null;
    applyFilter(controller);
    input.focus();
  };
  const onInput = () => {
    controller.pendingMutationFocus = null;
    applyFilter(controller);
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape" && input.value) {
      event.preventDefault();
      clearFilter();
      return;
    }
    if (event.key === "ArrowDown" && focusFirstVisibleRowControl(controller)) event.preventDefault();
  };
  const onListKeyDown = (event) => {
    if (event.key !== "Escape" || !normalizedQuery(input.value) || !list.contains(event.target)) return;
    event.preventDefault();
    input.focus();
  };
  const onListClick = (event) => rememberFilteredMutationFocus(controller, event);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);
  clear.addEventListener("click", clearFilter);
  list.addEventListener("click", onListClick, true);
  list.addEventListener("keydown", onListKeyDown, true);
  controller.onInput = onInput;
  controller.onKeyDown = onKeyDown;
  controller.onListKeyDown = onListKeyDown;
  controller.onListClick = onListClick;
  controller.clearFilter = clearFilter;

  if (typeof globalThis.MutationObserver === "function") {
    controller.observer = new globalThis.MutationObserver((mutations) => handleListMutations(controller, mutations));
    controller.observer.observe(list, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled"]
    });
  }

  applyFilter(controller);
  return controller;
}

for (const spec of filterSpecs) {
  const controller = installFilter(spec);
  if (controller) controllers.push(controller);
}

window.addEventListener("pagehide", () => {
  pageActive = false;
  for (const controller of controllers) {
    controller.pendingMutationFocus = null;
    controller.mutationQueued = false;
    controller.pendingPresentationChange = false;
    controller.pendingControlReenabled = false;
    controller.input.removeEventListener("input", controller.onInput);
    controller.input.removeEventListener("keydown", controller.onKeyDown);
    controller.clear.removeEventListener("click", controller.clearFilter);
    controller.list.removeEventListener("click", controller.onListClick, true);
    controller.list.removeEventListener("keydown", controller.onListKeyDown, true);
    try { controller.observer?.disconnect(); } catch { /* Best-effort UI teardown. */ }
    controller.observer = null;
  }
  controllers.length = 0;
}, { once: true });
