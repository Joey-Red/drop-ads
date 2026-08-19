import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const popupCss = await readFile(resolve(root, "src/popup/popup.css"), "utf8");
const optionsCss = await readFile(resolve(root, "src/options/options.css"), "utf8");
const popupJs = await readFile(resolve(root, "src/popup/popup.js"), "utf8");
const popupBoundaryJs = await readFile(resolve(root, "src/core/popup-boundary.js"), "utf8");
const optionsJs = await readFile(resolve(root, "src/options/options.js"), "utf8");
const cosmeticsJs = await readFile(resolve(root, "src/options/cosmetics.js"), "utf8");
const countryJs = await readFile(resolve(root, "src/options/country.js"), "utf8");
const actionCountJs = await readFile(resolve(root, "src/options/action-count.js"), "utf8");
const pickerJs = await readFile(resolve(root, "src/content/picker.js"), "utf8");
const pickerUiJs = await readFile(resolve(root, "src/content/picker-ui.js"), "utf8");
const optionsHtml = await readFile(resolve(root, "src/options/index.html"), "utf8");

const collaboratorSources = [popupJs, optionsJs, cosmeticsJs, countryJs];
const settingsCollaboratorSources = [optionsJs, cosmeticsJs, countryJs];
const directRuntimeReplyAccess = /\bresponse(?:\?\.|\.)(?:ok|error|result)\b/;
const directStorageStateAccess = /\bchanges(?:\?\.)?\[STORAGE_KEY\]/;

const checks = [
  [/:root\s*\{[^}]*font:\s*17px\/1\.5\s+system-ui/s.test(popupCss), "popup base type must remain at least the reviewed 17px scale"],
  [/min-width:\s*320px/.test(popupCss) && /@media\s*\(max-width:\s*360px\)/.test(popupCss), "popup must retain its reviewed 320px floor and narrow-width reflow"],
  [/min-height:\s*44px/.test(popupCss), "popup must retain 44px-class button targets"],
  [/input\[type="checkbox"\]\s*\{[^}]*width:\s*22px;[^}]*height:\s*22px/s.test(popupCss), "popup checkbox targets must remain enlarged"],
  [/:root\s*\{[^}]*font:\s*18px\/1\.55\s+system-ui/s.test(optionsCss), "Settings base type must remain at least the reviewed 18px scale"],
  [/button\s*\{[^}]*min-height:\s*44px/s.test(optionsCss), "Settings buttons must retain 44px-class targets"],
  [/input\[type="checkbox"\]\s*\{[^}]*width:\s*21px;[^}]*height:\s*21px/s.test(optionsCss), "Settings checkboxes must remain enlarged"],
  [/outline:\s*3px\s+solid\s+currentColor/.test(popupCss) && /outline:\s*3px\s+solid\s+currentColor/.test(optionsCss), "keyboard focus rings must remain prominent"],
  [/drop-ads:get-ui-state/.test(popupJs) && /installPopupStorageListener\(api,/.test(popupJs) && /capturePopupCollaboratorValue\(onChanged, "addListener"/.test(popupBoundaryJs), "popup must read serialized committed state and live-sync storage changes through the reviewed popup boundary"],
  [/Applying protection change/.test(popupJs) && /disabled\s*=\s*true/.test(popupJs), "popup must retain explicit pending feedback for policy changes"],
  [/drop-ads:start-element-picker/.test(popupJs) && /sendPopupTopFrameMessage\(api, currentTabId/.test(popupJs) && /Object\.freeze\(\{ frameId: 0 \}\)/.test(popupBoundaryJs), "popup picker must target the active page top frame explicitly through the reviewed popup boundary"],
  [/function withBusy\(/.test(optionsJs) && /aria-busy/.test(optionsJs), "Settings must retain scoped busy-state behavior"],
  [/installOwnedOptionsStorageListener\(api,/.test(optionsJs) && /internalMutationDepth\s*>\s*0\) return/.test(optionsJs), "Settings must live-sync external state without re-rendering its own committed mutations"],
  [/createDocumentFragment\(\)/.test(optionsJs), "Settings full list renders must retain fragment-based construction"],
  [/focusAfterMutation\(/.test(optionsJs), "Settings removals must retain keyboard focus recovery"],
  [/personalRuleConflictKeys/.test(optionsJs) && /Remove allow/.test(optionsJs), "Settings must surface personal allow/block conflicts and a direct resolution action"],
  [/id="country-settings"/.test(optionsHtml) && /country\.js/.test(optionsHtml), "Settings must expose country-code TLD controls"],
  [/drop-ads:add-personal-rule/.test(countryJs) && /drop-ads:remove-personal-rule/.test(countryJs) && /MutationObserver/.test(countryJs), "country controls must use transactional personal policy and keep generic rule labels understandable"],
  [/action-count\.js/.test(countryJs) && /Protection action count/.test(actionCountJs) && /setActionCountEnabled/.test(actionCountJs), "Settings must expose a privacy-safe hideable browser-owned protection action count"],
  [/id="cosmetic-settings"/.test(optionsHtml) && /cosmetics\.js/.test(optionsHtml), "Settings must expose the reviewed personal cosmetic controls"],
  [/drop-ads:add-cosmetic-rule/.test(cosmeticsJs) && /drop-ads:remove-cosmetic-rule/.test(cosmeticsJs) && /focusAfterRemoval/.test(cosmeticsJs), "cosmetic Settings controls must retain local add/remove and focus recovery"],
  [/Escape/.test(pickerJs) && /role="dialog"/.test(pickerUiJs) && /Hide on this site/.test(pickerUiJs) && />Cancel<\/button>/.test(pickerUiJs), "element picker must retain keyboard cancel and explicit save confirmation"],
  [collaboratorSources.every((source) => !directRuntimeReplyAccess.test(source)), "shipped popup/Settings code must not dereference runtime reply ok/error/result fields directly"],
  [settingsCollaboratorSources.every((source) => !directStorageStateAccess.test(source)), "shipped Settings code must not index persisted-state storage change containers directly"],
  [/unwrapPopupRuntimeResponse/.test(popupJs) && /popupStorageChangeAffectsPolicy/.test(popupJs), "popup browser collaborators must remain behind the reviewed popup boundary helpers"],
  [/unwrapOptionsRuntimeResponse/.test(optionsJs) && /isRelevantOptionsStorageChange/.test(optionsJs) && /unwrapOptionsRuntimeResponse/.test(countryJs) && /isRelevantOptionsStorageChange/.test(countryJs) && /unwrapOptionsRuntimeResponse/.test(cosmeticsJs) && /isRelevantOptionsStorageChange/.test(cosmeticsJs), "Settings browser collaborators must remain behind the reviewed shared boundary helpers"]
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  console.error("UI audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("UI audit passed: reviewed readability, collaborator boundaries, live-sync, country/count/cosmetic controls, picker accessibility, conflicts, and focus treatment are intact.");
}
