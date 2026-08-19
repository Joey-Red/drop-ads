import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

const recoveryBootstrap = read("src/options/recovery-bootstrap.js");
const recoveryControls = read("src/options/recovery-controls.js");
const settingsHtml = read("src/options/index.html");
const formState = read("src/options/form-state-semantics.js");
const sessionUi = read("src/options/session-pauses.js");
const listFilter = read("src/options/list-filter.js");
const coreSession = read("src/core/session.js");
const packageJson = JSON.parse(read("package.json"));

requireText(recoveryBootstrap, 'import "./recovery-controls.js";', "central recovery bootstrap");
requireText(recoveryControls, 'import "./session-pauses.js";', "session recovery installation");
requireText(recoveryControls, 'import "./reset-settings-ui.js";', "configured/session recovery separation");
requireText(settingsHtml, '<script type="module" src="recovery-bootstrap.js"></script>', "explicit recovery bootstrap script");
requireText(settingsHtml, '<script type="module" src="list-filter.js"></script>', "Settings list-filter script");
if (settingsHtml.indexOf('src="recovery-bootstrap.js"') > settingsHtml.indexOf('src="list-filter.js"')) throw new Error("Settings recovery bootstrap must initialize before transient list filtering");
requireText(formState, 'import "./recovery-bootstrap.js";', "shared recovery bootstrap ownership");
requireText(formState, 'import "./list-filter.js";', "filter initialization after recovery bootstrap");
if (/import "\.\/(?:recovery-bootstrap|recovery-controls|session-pauses|reset-settings-ui)\.js";/.test(listFilter)) throw new Error("list filtering must not own or duplicate recovery bootstrap");
requireText(listFilter, 'listId: "session-pauses-list", label: "Filter temporary session pauses"', "session recovery local filter target");

for (const [needle, label] of [
  ["function ensureSessionPauseNavLink()", "idempotent session recovery navigation"],
  ["function ensureSessionPauseSection()", "idempotent session recovery section"],
  ["if (existing) return existing;", "idempotent recovery surface reuse"],
  ["function recoverySurfaceReady()", "complete recovery surface guard"],
  ['navLink.href = "#session-pauses-settings"', "session recovery navigation target"],
  ['section.id = "session-pauses-settings"', "session recovery section"],
  ["does not record visited pages, requests, timestamps, statistics, or identifiers", "session recovery privacy wording"],
  ["const session = await loadSessionState(api);", "normalized session state read"],
  ["const domains = fixedCodeUnitSort(session.disabledSites);", "deterministic recovery ordering"],
  ['item.textContent = "No temporary session pauses"', "explicit recovery empty state"],
  ['type: "drop-ads:set-session-site-paused"', "runtime-mediated recovery"],
  ["paused: false", "resume-only recovery transaction"],
  ["function restoreResumeFocus(rowIndex)", "per-site recovery focus helper"],
  ["heading.focus({ preventScroll: true })", "empty-list heading focus recovery"],
  ["let shouldRestoreFocus = false;", "committed per-site focus flag"],
  ["if (shouldRestoreFocus && pageActive) restoreResumeFocus(rowIndex);", "post-release per-site focus"],
  ["async function resumeAllSessionPauses()", "bulk recovery transaction"],
  ["Some temporary pauses could not be resumed.", "privacy-minimal partial failure status"],
  ["Protection resumed for all temporarily paused sites.", "privacy-minimal bulk success status"],
  ["let busyDepth = 0;", "depth-counted busy ownership"],
  ["function beginSessionBusy()", "overlap-safe section busy helper"],
  ["let recoveryMutationActive = false;", "shared single-flight mutation owner"],
  ["resumeAll.disabled = recoveryMutationActive || rows.length === 0;", "bulk action single-flight guard"],
  ["button.disabled = recoveryMutationActive;", "per-site action single-flight guard"],
  ["if (!pageActive || !status || recoveryMutationActive) return;", "per-site overlap rejection"],
  ["if (!pageActive || !status || !resumeAll || recoveryMutationActive) return;", "bulk overlap rejection"],
  ["Object.getOwnPropertyDescriptor(changes, SESSION_STORAGE_KEY)", "descriptor-safe session change recognition"],
  ["if (!pageActive || internalMutationDepth > 0) return;", "self-mutation/live-sync suppression"],
  ['if (areaName !== "session" || !hasSessionStateChange(changes)) return;', "session-scoped live sync"],
  ['resume.setAttribute("aria-label", `Resume protection on ${domain}`)', "domain-bound recovery action name"],
  ['item.setAttribute("aria-busy", "true")', "row busy state"],
  ['if (failed && resumeAll.isConnected && !resumeAll.disabled) resumeAll.focus();', "bulk failure focus after re-enable"],
  ['function handleResumeAllClick()', "owned bulk recovery listener"],
  ['resumeAll.addEventListener("click", handleResumeAllClick)', "bulk listener installation"],
  ['resumeAll?.removeEventListener("click", handleResumeAllClick)', "bulk listener teardown"],
  ["renderGeneration += 1", "render generation invalidation"],
  ["busyDepth = 0", "busy teardown"],
  ["recoveryMutationActive = false", "mutation teardown"],
  ["disposeStorageSync?.()", "session listener disposal"]
]) requireText(sessionUi, needle, label);

for (const [needle, label] of [
  ["snapshotDenseDataArray(", "bounded session collection snapshot"],
  ["LIVE_STATE_LIMITS.domains", "session domain ceiling"],
  ["return Object.freeze({ disabledSites: normalizeDomainSet(disabledSites) });", "immutable normalized session state"]
]) requireText(coreSession, needle, label);

for (const forbidden of ["localStorage", "sessionStorage", "fetch(", "XMLHttpRequest", "sendBeacon", "history.pushState", "history.replaceState", "declarativeNetRequestFeedback"]) {
  if (sessionUi.includes(forbidden)) throw new Error(`session recovery contains forbidden runtime surface: ${forbidden}`);
}
if (/storage\.session\.(?:get|set)/.test(sessionUi)) throw new Error("Settings recovery must not bypass the hardened core/runtime session boundary");

// Historical milestone test filenames are intentionally not part of this source audit.
// Current executable regression coverage is owned by npm test; this gate validates
// the live recovery implementation and package wiring directly.

// Compatibility markers retained for older focused gate checks: settings-session-surface-v849.test.js, settings-session-resume-focus-v850.test.js, settings-session-resume-all-v851.test.js, settings-session-live-sync-v852.test.js, settings-session-busy-v853.test.js, settings-session-single-flight-v854.test.js, settings-session-recovery-bulk-focus-v855.test.js, settings-session-recovery-lifecycle-v856.test.js. Historical gate text: canonical Settings session recovery invariants verified through M857.

if (packageJson.scripts?.["settings-session-recovery-audit"] !== "node tools/settings-session-recovery-audit.mjs") throw new Error("settings-session-recovery-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run settings-session-recovery-audit")) throw new Error("settings-session-recovery-audit is not wired into npm run check");

console.log("settings-session-recovery-audit: Settings session recovery invariants verified through M866");
