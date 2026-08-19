import "./form-state-semantics.js";
import "./mutation-target-semantics.js";
import "./subscription-presentation.js";

const countryList = document.querySelector("#country-list");
const cosmeticHideList = document.querySelector("#cosmetic-hide-list");
const cosmeticAllowList = document.querySelector("#cosmetic-allow-list");
let countryObserver = null;
let cosmeticHideObserver = null;
let cosmeticAllowObserver = null;

function enhanceCountryRows() {
  if (!countryList) return;
  let rowIndex = 0;
  for (const row of countryList.querySelectorAll("li:not(.empty)")) {
    rowIndex += 1;
    const label = row.querySelector(".rule-copy > code");
    const note = row.querySelector(".rule-copy > .rule-note");
    const controls = row.querySelector(".subscription-controls");
    const mode = controls?.querySelector("select");
    const remove = controls?.querySelector("button.remove");
    if (!label || !note || !controls) continue;

    const labelId = `country-row-label-${rowIndex}`;
    const noteId = `country-row-note-${rowIndex}`;
    label.id = labelId;
    note.id = noteId;
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-labelledby", labelId);
    controls.setAttribute("aria-describedby", `${noteId} country-status`);
    if (mode) {
      mode.setAttribute("aria-describedby", `${noteId} country-status`);
      mode.setAttribute("aria-controls", "country-list");
    }
    if (remove) {
      const labelText = label.textContent?.trim() ?? "";
      if (remove.textContent !== "Remove country block") remove.textContent = "Remove country block";
      if (labelText) remove.setAttribute("aria-label", `Remove country block ${labelText}`);
      remove.setAttribute("aria-describedby", `${noteId} country-status`);
      remove.setAttribute("aria-controls", "country-list");
    }
  }
}

function enhanceCosmeticRows(list, prefix, errorId) {
  if (!list) return;
  let rowIndex = 0;
  for (const row of list.querySelectorAll("li:not(.empty)")) {
    rowIndex += 1;
    const selector = row.querySelector(".rule-copy > code");
    const scope = row.querySelector(".rule-copy > .rule-note");
    const remove = row.querySelector("button.remove");
    if (!selector || !scope || !remove) continue;

    const selectorId = `${prefix}-row-selector-${rowIndex}`;
    const scopeId = `${prefix}-row-scope-${rowIndex}`;
    selector.id = selectorId;
    scope.id = scopeId;
    row.setAttribute("aria-labelledby", selectorId);
    row.setAttribute("aria-describedby", scopeId);
    const selectorText = selector.textContent?.trim() ?? "";
    const scopeText = scope.textContent?.trim() ?? "";
    if (remove.textContent !== "Remove cosmetic rule") remove.textContent = "Remove cosmetic rule";
    if (selectorText && scopeText) remove.setAttribute("aria-label", `Remove cosmetic rule ${selectorText} on ${scopeText}`);
    remove.setAttribute("aria-describedby", `${scopeId} ${errorId}`);
    remove.setAttribute("aria-controls", list.id);
  }
}

function enhanceCosmeticHideRows() {
  enhanceCosmeticRows(cosmeticHideList, "cosmetic-hide", "cosmetic-hide-error");
}

function enhanceCosmeticAllowRows() {
  enhanceCosmeticRows(cosmeticAllowList, "cosmetic-allow", "cosmetic-allow-error");
}

enhanceCountryRows();
if (countryList && typeof globalThis.MutationObserver === "function") {
  countryObserver = new globalThis.MutationObserver(enhanceCountryRows);
  countryObserver.observe(countryList, { childList: true, subtree: true });
}

enhanceCosmeticHideRows();
enhanceCosmeticAllowRows();
if (typeof globalThis.MutationObserver === "function") {
  if (cosmeticHideList) {
    cosmeticHideObserver = new globalThis.MutationObserver(enhanceCosmeticHideRows);
    cosmeticHideObserver.observe(cosmeticHideList, { childList: true, subtree: true });
  }
  if (cosmeticAllowList) {
    cosmeticAllowObserver = new globalThis.MutationObserver(enhanceCosmeticAllowRows);
    cosmeticAllowObserver.observe(cosmeticAllowList, { childList: true, subtree: true });
  }
}

window.addEventListener("pagehide", () => {
  try { countryObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  countryObserver = null;
  try { cosmeticHideObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  cosmeticHideObserver = null;
  try { cosmeticAllowObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  cosmeticAllowObserver = null;
}, { once: true });
