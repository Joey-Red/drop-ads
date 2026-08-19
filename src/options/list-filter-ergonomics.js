const settingsNav = document.querySelector(".settings-nav");
const filterInputs = [...document.querySelectorAll('.list-filter input[type="search"][aria-controls]')];
const controlledListIds = filterInputs
  .map((input) => input.getAttribute("aria-controls"))
  .filter((value) => typeof value === "string" && value.length > 0);
const listBindings = [];
let pageActive = true;

function hasActiveFilter() {
  return filterInputs.some((input) => typeof input.value === "string" && input.value.length > 0);
}

function dispatchFilterInput(input) {
  try {
    input.dispatchEvent(new Event("input", { bubbles: true }));
  } catch {
    // The value change remains local; the native per-filter handler is authoritative when dispatch is available.
  }
}

function recoverHiddenRowFocus(input, list) {
  if (!pageActive || !input.value) return;
  const active = document.activeElement;
  if (!active || !list.contains(active)) return;
  const row = active.closest?.("li");
  if (row?.hidden) input.focus();
}

function queueHiddenRowFocusRecovery(input, list) {
  try {
    queueMicrotask(() => recoverHiddenRowFocus(input, list));
  } catch {
    recoverHiddenRowFocus(input, list);
  }
}

const filterBadges = new Map();
for (const input of filterInputs) {
  const listId = input.getAttribute("aria-controls");
  const list = listId ? document.getElementById(listId) : null;
  if (list) {
    const onKeyDown = (event) => {
      if (!input.value || event.key !== "ArrowUp" || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!list.contains(event.target)) return;
      event.preventDefault();
      input.focus();
    };
    list.setAttribute("aria-keyshortcuts", "Alt+ArrowUp");
    list.addEventListener("keydown", onKeyDown);

    let focusObserver = null;
    if (typeof globalThis.MutationObserver === "function") {
      focusObserver = new globalThis.MutationObserver(() => queueHiddenRowFocusRecovery(input, list));
      focusObserver.observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["hidden"]
      });
    }
    listBindings.push({ list, onKeyDown, focusObserver });
  }

  const section = input.closest("section[id]");
  const sectionId = section?.id;
  if (!sectionId) continue;
  const link = settingsNav?.querySelector(`a[href="#${sectionId}"]`);
  if (!link) continue;
  const badge = document.createElement("span");
  badge.className = "list-filter-nav-badge";
  badge.textContent = "Filtered";
  badge.hidden = true;
  link.append(document.createTextNode(" "), badge);
  filterBadges.set(input, badge);
}

const toolbar = document.createElement("div");
toolbar.className = "list-filter-toolbar";
toolbar.setAttribute("role", "group");
toolbar.setAttribute("aria-label", "List filter actions");

const clearAll = document.createElement("button");
clearAll.type = "button";
clearAll.className = "secondary-action list-filter-clear-all";
clearAll.textContent = "Clear all list filters";
if (controlledListIds.length) clearAll.setAttribute("aria-controls", controlledListIds.join(" "));

const status = document.createElement("span");
status.id = "list-filter-global-status";
status.className = "hint list-filter-global-status";
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
status.setAttribute("aria-atomic", "true");
clearAll.setAttribute("aria-describedby", status.id);

function syncFilterToolbar() {
  if (!pageActive) return;
  const active = hasActiveFilter();
  clearAll.disabled = !active;
  const nextStatus = active ? "One or more list filters are active." : "";
  if (status.textContent !== nextStatus) status.textContent = nextStatus;
  for (const [input, badge] of filterBadges) badge.hidden = !(typeof input.value === "string" && input.value.length > 0);
}

function clearAllFilters() {
  for (const input of filterInputs) {
    if (!input.value) continue;
    input.value = "";
    dispatchFilterInput(input);
  }
  syncFilterToolbar();
}

function handleFilterInput() {
  syncFilterToolbar();
}

for (const input of filterInputs) input.addEventListener("input", handleFilterInput);
clearAll.addEventListener("click", clearAllFilters);
toolbar.append(clearAll, status);
settingsNav?.after(toolbar);
syncFilterToolbar();

window.addEventListener("pagehide", () => {
  pageActive = false;
  for (const input of filterInputs) input.removeEventListener("input", handleFilterInput);
  for (const { list, onKeyDown, focusObserver } of listBindings) {
    list.removeEventListener("keydown", onKeyDown);
    try { focusObserver?.disconnect(); } catch { /* Best-effort Settings teardown. */ }
  }
  listBindings.length = 0;
  clearAll.removeEventListener("click", clearAllFilters);
  for (const badge of filterBadges.values()) badge.remove();
  filterBadges.clear();
  toolbar.remove();
}, { once: true });
