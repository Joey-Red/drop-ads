import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}
function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) throw new Error(`${label} is missing`);
}

const html = read("src/options/index.html");
const optionsCss = read("src/options/options.css");
const ui = read("src/options/ui-semantics.js");
const dynamic = read("src/options/dynamic-list-semantics.js");
const policyRows = read("src/options/policy-row-semantics.js");
const popupHtml = read("src/popup/index.html");
const popupCss = read("src/popup/popup.css");
const popupJs = read("src/popup/popup.js");
const popupSemantics = read("src/popup/popup-semantics.js");

for (const [needle, label] of [
  ['<main id="settings-main" aria-labelledby="settings-title">', "labelled Settings main"],
  ['<nav class="settings-nav" aria-label="Settings sections">', "Settings section navigation"],
  ['aria-label="Personal block rules"', "named personal block list"],
  ['aria-label="Configured filter lists"', "named subscription list"],
  ['id="backup-error" class="error" role="alert" aria-atomic="true"', "atomic backup error"],
  ['id="auto-submit" type="checkbox" aria-describedby="community-help"', "community privacy relationship"],
  ['<script type="module" src="ui-semantics.js"></script>', "Settings UI semantics loader"],
  ['<script type="module" src="dynamic-list-semantics.js"></script>', "dynamic list semantics loader"],
  ['id="block-input" type="text" inputmode="url" enterkeyhint="done" required', "required block input"],
  ['id="allow-input" type="text" inputmode="url" enterkeyhint="done" required', "required allow input"],
  ['id="cookie-exception-input" type="text" inputmode="url" enterkeyhint="done" required', "required cookie exception input"]
]) requireText(html, needle, label);

for (const [needle, label] of [
  ['import "./form-state-semantics.js";', "canonical Settings form-state graph"],
  ['control.setAttribute("aria-controls", listId)', "action/list relationship"],
  ['backupGroup.setAttribute("aria-labelledby", "backup-heading")', "visible backup group label"],
  ['link.setAttribute("aria-current", "location")', "current Settings section marker"],
  ['heading.focus({ preventScroll: true })', "Settings destination focus"],
  ['importSettingsButton.disabled = !(importSettingsFile?.files?.length > 0)', "backup selection gate"],
  ['Backup file selected and ready to import.', "generic backup readiness"],
  ['action.textContent = "Re-enable"', "disabled-site recovery wording"],
  ['action.textContent = "Remove exception"', "cookie exception wording"]
]) requireText(ui, needle, label);

for (const [needle, label] of [
  ['import "./policy-row-semantics.js";', "policy-row semantics graph"],
  ['function enhancePersonalRuleRows(list, prefix)', "personal row semantics"],
  ['remove.textContent = "Remove rule"', "personal rule removal wording"],
  ['action.textContent = "Prepare submission"', "community preparation wording"],
  ['action.textContent = "Remove allow override"', "allow override wording"],
  ['function restoreOverrideFocus()', "allow override focus recovery"],
  ['checkbox.setAttribute("aria-labelledby", titleId)', "subscription visible-title labelling"],
  ['remove.textContent = "Remove list"', "subscription removal wording"],
  ['subscriptionUrlInput?.focus()', "subscription removal fallback focus"]
]) requireText(dynamic, needle, label);

for (const [needle, label] of [
  ['function enhanceCountryRows()', "country row semantics"],
  ['controls.setAttribute("aria-describedby", `${noteId} country-status`)', "country row description"],
  ['function enhanceCosmeticRows(list, prefix, errorId)', "cosmetic row semantics"],
  ['row.setAttribute("aria-labelledby", selectorId)', "cosmetic visible selector label"],
  ['remove.setAttribute("aria-describedby", `${scopeId} ${errorId}`)', "cosmetic removal feedback relationship"]
]) requireText(policyRows, needle, label);

for (const [pattern, label] of [
  [/\.settings-nav a \{[^}]*min-height: 44px;/s, "44px Settings nav targets"],
  [/\.jump-focus-target:focus \{ outline: 3px solid currentColor; outline-offset: 4px; \}/, "jump focus cue"],
  [/@media \(forced-colors: active\)/, "Settings forced-colors support"],
  [/@media \(prefers-contrast: more\)/, "Settings increased-contrast support"],
  [/@media \(prefers-reduced-motion: reduce\)/, "Settings reduced-motion support"],
  [/@media \(max-width: 520px\)/, "Settings narrow reflow"]
]) requireMatch(optionsCss, pattern, label);

for (const [needle, label] of [
  ['<main id="popup-main" aria-labelledby="popup-title" aria-describedby="popup-privacy-note" aria-busy="false">', "popup labelled/privacy-described main"],
  ['id="popup-privacy-note">Local only · no telemetry</span>', "popup local-only privacy note"],
  ['id="site-unavailable" class="site-unavailable" role="status" aria-live="polite" aria-atomic="true" hidden', "popup site availability status"],
  ['<script type="module" src="popup-semantics.js"></script>', "popup semantics loader"]
]) requireText(popupHtml, needle, label);

for (const [needle, label] of [
  ['let pageActive = true;', "popup active-page boundary"],
  ['pageActive = false;', "popup pagehide invalidation"],
  ['committedRenderGeneration += 1;', "popup render invalidation"],
  ['if (!pageActive || generation !== committedRenderGeneration) return false;', "popup stale render rejection"]
]) requireText(popupJs, needle, label);

for (const [needle, label] of [
  ['pauseSite.setAttribute("aria-pressed", paused ? "true" : "false")', "popup pause toggle state"],
  ['siteEnabled?.setAttribute("aria-label", `Protection on ${site}`)', "site-specific protection label"],
  ['cookieSiteEnabled?.setAttribute("aria-label", `Cookie protection on ${site}`)', "site-specific cookie label"],
  ['return "Cookie protection is disabled for this site by a local exception.";', "local cookie exception explanation"],
  ['observer?.disconnect()', "popup semantics observer teardown"]
]) requireText(popupSemantics, needle, label);

for (const [pattern, label] of [
  [/body \{[^}]*min-width: 320px;/s, "popup width floor"],
  [/@media \(max-width: 360px\)/, "popup narrow reflow"],
  [/@media \(prefers-contrast: more\)/, "popup increased contrast"],
  [/@media \(prefers-reduced-motion: reduce\)/, "popup reduced motion"]
]) requireMatch(popupCss, pattern, label);

if (/\.site-name \{[^}]*text-overflow: ellipsis;/s.test(popupCss)) {
  throw new Error("popup site identity must not be ellipsis-truncated");
}

// Accessibility behavior is audited directly from shipped HTML/CSS/JS above.
// Historical milestone test filenames are not release/source requirements.

console.log("settings-accessibility-audit: Settings and popup accessibility invariants verified through M808");
