import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }

const html = read("src/options/index.html");
const filter = read("src/options/list-filter.js");
const ergonomics = read("src/options/list-filter-ergonomics.js");
const landmarks = read("src/options/list-filter-landmarks.js");
const css = read("src/options/list-filter.css");
const targets = read("src/options/mutation-target-semantics.js");
const subscriptions = read("src/options/subscription-presentation.js");
const policyRows = read("src/options/policy-row-semantics.js");
const selectorUtils = read("src/content/selector-utils.js");

requireText(html, '<link rel="stylesheet" href="list-filter.css">', "filter stylesheet load");
requireText(html, '<script type="module" src="list-filter.js"></script>', "filter module load");
requireText(landmarks, 'import "./list-filter-ergonomics.js";', "list-filter ergonomics load");
requireText(landmarks, 'list-filter.js owns the synthetic "no matching entries" row', "single no-match owner guidance");
if (landmarks.includes('import "./list-filter-no-match.js";')) {
  throw new Error("list-filter landmarks must not install the legacy independent no-match observer");
}
for (const id of ["block-list", "allow-list", "disabled-sites", "cookie-exception-list", "subscription-list", "country-list", "cosmetic-hide-list", "cosmetic-allow-list"]) {
  requireText(filter, `listId: "${id}"`, `filter spec ${id}`);
}
requireText(filter, 'listId: "session-pauses-list", label: "Filter temporary session pauses"', "session-pause filter spec");

for (const [needle, label] of [
  ["const FILTER_QUERY_LIMIT = 256;", "query bound"],
  ['Filters only this Settings page and is not saved.', "privacy cue"],
  ['.trim().toLowerCase()', "deterministic matching"],
  ['function isSyntheticPresentationRow(row)', "presentation-only synthetic row boundary"],
  ['if (isSyntheticPresentationRow(row)) continue;', "synthetic row evaluation exclusion"],
  ['function rowIdentityNode(row)', "identity-only matching"],
  ['wrapper.setAttribute("role", "search")', "named search region"],
  ['input.setAttribute("aria-keyshortcuts", "Escape ArrowDown")', "keyboard shortcuts"],
  ['return hasMatches ? "Filter active" : "No matching entries";', "statistics-free feedback"],
  ['function updateNoMatchRow(controller, query, hasEntries, hasMatches)', "single-owner no-match presentation"],
  ['row.className = "list-filter-no-match"', "no-match synthetic class"],
  ['row.setAttribute("aria-hidden", "true")', "no-match duplicate-announcement suppression"],
  ['row.textContent = "No matching entries"', "no-match visual text"],
  ['if (event.key === "Escape" && input.value)', "Escape recovery"],
  ['if (event.key === "ArrowDown" && focusFirstVisibleRowControl(controller))', "visible-row keyboard entry"],
  ['function scheduleListMutationWork(controller)', "coalesced rerender scheduling"],
  ['function rememberFilteredMutationFocus(controller, event)', "filtered mutation focus capture"],
  ['function restoreFilteredMutationFocus(controller)', "filtered mutation focus recovery"],
  ['controller.observer = new globalThis.MutationObserver((mutations) => handleListMutations(controller, mutations));', "single list observer ownership"],
  ['window.addEventListener("pagehide"', "filter lifecycle teardown"]
]) requireText(filter, needle, label);

for (const [needle, label] of [
  ['Clear all list filters', "clear-all action"],
  ['One or more list filters are active.', "generic global filter status"],
  ['badge.textContent = "Filtered"', "filtered section badge"],
  ['list.setAttribute("aria-keyshortcuts", "Alt+ArrowUp")', "row-to-filter keyboard return"],
  ['function recoverHiddenRowFocus(input, list)', "hidden-row focus recovery"],
  ['if (row?.hidden) input.focus()', "hidden-row filter fallback"],
  ['clearAll.setAttribute("aria-controls", controlledListIds.join(" "))', "clear-all controlled-list scope"],
  ['toolbar.setAttribute("role", "group")', "filter toolbar grouping"],
  ['focusObserver?.disconnect()', "filter focus observer teardown"]
]) requireText(ergonomics, needle, label);

for (const [needle, label] of [
  ['const MAX_CLASS_TOKEN_SCAN = 64;', "picker class scan bound"],
  ['const MAX_SELECTED_CLASS_TOKENS = 3;', "picker selected class bound"],
  ['tokens.sort(fixedCodeUnitCompare);', "picker deterministic class ordering"],
  ['"data-test-id"', "reviewed data-test-id selector identity"],
  ['"data-cy"', "reviewed data-cy selector identity"],
  ['"data-automation-id"', "reviewed data-automation-id selector identity"]
]) requireText(selectorUtils, needle, label);

for (const [needle, label] of [
  ['remove.textContent = "Remove country block"', "explicit country removal wording"],
  ['`Remove country block ${labelText}`', "country removal identity"],
  ['remove.textContent = "Remove cosmetic rule"', "explicit cosmetic removal wording"],
  ['`Remove cosmetic rule ${selectorText} on ${scopeText}`', "cosmetic removal identity"]
]) requireText(policyRows, needle, label);

if (/toLocaleLowerCase|localeCompare/.test(filter)) throw new Error("list-filter matching must not depend on host locale");
if (/let\s+(?:total|shown)\b|\$\{shown\}|\$\{total\}|\bshown\s+of\b/i.test(filter + ergonomics)) throw new Error("list-filter feedback must remain statistics-free");
if (/saveState|sendMessage|fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|analytics|telemetry/.test(filter + ergonomics)) throw new Error("list-filter must remain local and non-persistent");

for (const [needle, label] of [
  ['remove.setAttribute("aria-controls", listId)', "personal mutation target"],
  ['checkbox.setAttribute("aria-controls", "subscription-list")', "subscription mutation target"],
  ['applySimpleListTarget(lists.country, "country-list", "select, button.remove")', "country mutation target"],
  ['applySimpleListTarget(lists.cosmeticHide, "cosmetic-hide-list")', "cosmetic mutation target"]
]) requireText(targets, needle, label);

for (const [needle, label] of [
  ['import { subscriptionCommitStatus } from "../core/ui-commit-status.js";', "shared subscription commit-status helper"],
  ['"External HTTPS list" : "Built-in list"', "subscription origin"],
  ['subscriptionCommitStatus(Boolean(checkbox.checked), checkboxBusy(checkbox))', "subscription configured-state presentation"],
  ['attributeFilter: ["disabled", "aria-busy"]', "subscription busy-state observation"],
  ['subscriptionPresentationObserver?.disconnect()', "subscription presentation teardown"]
]) requireText(subscriptions, needle, label);

for (const [needle, label] of [
  ['grid-template-columns: minmax(0, 1fr) auto', "filter layout"],
  ['min-height: 44px', "44px filter target"],
  [':focus-visible', "filter focus visibility"],
  ['.list-filter-toolbar', "global filter toolbar presentation"],
  ['.list-filter-nav-badge', "filtered section badge presentation"],
  ['@media (max-width: 520px)', "narrow filter layout"],
  ['@media (prefers-contrast: more)', "filter increased contrast"],
  ['@media (forced-colors: active)', "filter forced colors"]
]) requireText(css, needle, label);

// Historical milestone test-file presence is intentionally not part of this audit.
// The live Settings implementation above is the source of truth; npm test owns
// executable regression coverage.

console.log("settings-list-filter-audit: Settings list-filter invariants verified through canonical M843");
