import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}
function requireAttributeTokens(source, id, attribute, expectedTokens, label) {
  const tag = new RegExp(`<[^>]*\\bid="${id}"[^>]*>`, "i").exec(source)?.[0];
  if (!tag) throw new Error(`${label} control is missing`);
  const value = new RegExp(`\\b${attribute}="([^"]*)"`, "i").exec(tag)?.[1];
  if (value == null) throw new Error(`${label} ${attribute} is missing`);
  const tokens = new Set(value.split(/\s+/).filter(Boolean));
  for (const token of expectedTokens) {
    if (!tokens.has(token)) throw new Error(`${label} is missing ${attribute} target: ${token}`);
  }
}

const filters = read("src/options/list-filter.js");
const formState = read("src/options/form-state-semantics.js");
const country = read("src/options/country.js");
const mutationTargets = read("src/options/mutation-target-semantics.js");
const popupHtml = read("src/popup/index.html");
const popupSemantics = read("src/popup/popup-semantics.js");
const popupJs = read("src/popup/popup.js");

for (const [needle, label] of [
  ['import "./list-filter.js";', "Settings list-filter entrypoint"],
  ['{ listId: "block-list", label: "Filter personal block rules" }', "block-list filter"],
  ['{ listId: "allow-list", label: "Filter personal allow rules" }', "allow-list filter"],
  ['{ listId: "disabled-sites", label: "Filter disabled sites" }', "disabled-sites filter"],
  ['{ listId: "cookie-exception-list", label: "Filter cookie exceptions" }', "cookie-exception filter"],
  ['const FILTER_QUERY_LIMIT = 256', "bounded local filter query"],
  ['input.setAttribute("aria-controls", spec.listId)', "filter target relationship"],
  ['controller.observer?.disconnect()', "filter observer teardown"]
]) requireText(needle.startsWith('import ') ? formState : filters, needle, label);

if (/localStorage|sessionStorage|storage\.|fetch\(|sendMessage|history\./i.test(filters)) {
  throw new Error("Settings list filtering must stay transient and local-only");
}

for (const [needle, label] of [
  ['remove.textContent = "Remove TLD block"', "explicit Country remove wording"],
  ['const rendered = await renderSafely("Could not refresh country settings", true);', "failed Country mutation committed rerender"],
  ['if (rendered) restoreCountryModeFocus(item.tld);', "failed Country mutation focus recovery"]
]) requireText(country, needle, label);

requireText(mutationTargets, 'applySimpleListTarget(lists.country, "country-list", "select, button.remove")', "Country row mutation targets");

requireAttributeTokens(
  popupHtml,
  "enabled",
  "aria-controls",
  ["site-section", "global-status", "engine-status"],
  "global popup protection dependency"
);
requireAttributeTokens(
  popupHtml,
  "site-enabled",
  "aria-controls",
  ["cookie-site-row", "cookie-banner-site-row", "pause-site", "pick-element", "session-status"],
  "site protection dependency"
);
requireAttributeTokens(
  popupHtml,
  "pause-site",
  "aria-controls",
  ["cookie-site-row", "cookie-site-enabled", "cookie-banner-site-row", "cookie-banner-site-enabled", "pick-element", "session-status"],
  "session pause dependency"
);
for (const [needle, label] of [
  ['id="popup-privacy-note">Local only · no telemetry</span>', "popup privacy boundary"],
  ['id="global-help" class="control-help">Master switch. Turning blocking off keeps your local rules and exceptions saved.</p>', "popup global guidance"]
]) requireText(popupHtml, needle, label);

for (const [needle, label] of [
  ['Protection is disabled for this site until you turn it back on.', "persistent site-disable explanation"],
  ['Protection is paused for this browser session only.', "session pause explanation"],
  ['if (existing && !ownsCurrentText) return;', "popup transaction feedback preservation"],
  ['observer?.disconnect()', "popup semantics teardown"]
]) requireText(popupSemantics, needle, label);

for (const [needle, label] of [
  ['Opening Settings…', "popup Settings opening status"],
  ['if (!pageActive)', "popup lifecycle guard"]
]) requireText(popupJs, needle, label);

// Current interaction/recovery behavior is validated directly above. Historical
// milestone test filenames are intentionally not required by this audit.

console.log("recovery-popup-interaction-audit: M809-M817 current-state invariants verified");
