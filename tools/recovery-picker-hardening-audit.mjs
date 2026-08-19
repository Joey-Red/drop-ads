import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }

const noMatch = read("src/options/list-filter-no-match.js");
const landmarks = read("src/options/list-filter-landmarks.js");
const selector = read("src/content/selector-utils.js");
const pauses = read("src/options/session-pauses.js");
const resetUi = read("src/options/reset-settings-ui.js");
const background = read("src/background.js");
const resetRuntime = read("src/core/settings-reset-runtime.js");
const resetOperation = read("src/core/settings-reset-operation.js");
const resetState = read("src/core/settings-reset.js");

requireText(landmarks, 'import "./list-filter-no-match.js";', "no-match helper load");

for (const [needle, label] of [
  ['placeholder.textContent = "No entries match this filter."', "visual no-match row"],
  ['placeholder.setAttribute("aria-hidden", "true")', "visual-only no-match semantics"],
  ['binding.observer?.disconnect()', "no-match observer teardown"]
]) requireText(noMatch, needle, label);

for (const [needle, label] of [
  ['const MAX_CLASS_TOKEN_SCAN = 64;', "picker class scan bound"],
  ['const MAX_SELECTED_CLASS_TOKENS = 3;', "picker class selection bound"],
  ['const SAFE_ATTRIBUTE_NAMES = ["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id", "role", "type"];', "reviewed picker attribute catalog"],
  ['if (value !== value.trim()) return null;', "lossless picker token admission"],
  ['tokens.sort(fixedCodeUnitCompare);', "deterministic picker class ordering"],
  ['function selectorCarriesIdentity(part, element)', "picker identity-bearing uniqueness guard"],
  ['const directCandidates = directIdentityCandidates(element);', "reviewed direct picker candidates"]
]) requireText(selector, needle, label);

for (const [needle, label] of [
  ['navLink.href = "#session-pauses-settings"', "session-pause Settings nav"],
  ['section.id = "session-pauses-settings"', "session-pause Settings section"],
  ['browser session storage only', "ephemeral session-pause guidance"],
  ['resume.textContent = "Resume protection"', "per-site session recovery action"],
  ['type: "drop-ads:set-session-site-paused"', "session recovery transaction"],
  ['paused: false', "session recovery unpause request"],
  ['restoreResumeFocus(rowIndex)', "session recovery focus restoration"],
  ['disposeStorageSync?.()', "session-pause storage listener teardown"]
]) requireText(pauses, needle, label);

for (const [needle, label] of [
  ['globalThis.confirm(RESET_CONFIRMATION)', "explicit configured-reset confirmation"],
  ['type: "drop-ads:reset-settings"', "configured-reset request"],
  ['does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry', "configured-reset privacy cue"],
  ['Temporary session pauses were left unchanged.', "configured-reset session separation feedback"]
]) requireText(resetUi, needle, label);
requireText(background, 'installSettingsResetRuntime({ api, core: runtime })', "configured-reset runtime installation");
requireText(resetRuntime, 'validateSettingsResetMessage(message)', "configured-reset message validation");
requireText(resetOperation, 'await core.importSettingsBackup(backupText);', "configured-reset transactional activation");
requireText(resetState, 'subscriptions: normalizeSubscriptions(DEFAULT_STATE.subscriptions)', "configured-reset canonical subscriptions");

if (/localStorage|sessionStorage|indexedDB|analytics|telemetry|sendBeacon|XMLHttpRequest|WebSocket|EventSource/.test(noMatch)) {
  throw new Error("no-match presentation must remain local and non-persistent");
}
if (/localStorage|sessionStorage|indexedDB|analytics|telemetry|sendBeacon|XMLHttpRequest|WebSocket|EventSource/.test(pauses)) {
  throw new Error("session pause recovery must not introduce persistence or telemetry surfaces");
}

for (const path of [
  "tests/settings-list-filter-no-match-v839.test.js",
  "tests/picker-class-determinism-v840.test.js",
  "tests/picker-stable-attributes-v841.test.js",
  "tests/picker-token-admission-v842.test.js",
  "tests/selector-bare-tag-probe-v843.test.js",
  "tests/settings-session-pauses-surface-v844.test.js",
  "tests/settings-session-pause-resume-v845.test.js",
  "tests/settings-configured-reset-v846.test.js"
]) {
  if (!fs.existsSync(new URL(`../${path}`, import.meta.url))) throw new Error(`required M839-M846 regression is missing: ${path}`);
}

console.log("recovery-picker-hardening-audit: M839-M846 recovery and picker invariants verified");
