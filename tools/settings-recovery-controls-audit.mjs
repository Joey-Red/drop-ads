import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function rejectMatch(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} is forbidden`); }

const session = read("src/options/session-pauses.js");
const resetUi = read("src/options/reset-settings-ui.js");
const recoveryBootstrap = read("src/options/recovery-bootstrap.js");
const recoveryControls = read("src/options/recovery-controls.js");
const settingsHtml = read("src/options/index.html");
const sessionAudit = read("tools/settings-session-recovery-audit.mjs");
const resetAudit = read("tools/settings-reset-audit.mjs");
const packageJson = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [recoveryBootstrap, 'import "./recovery-controls.js";', "single recovery bootstrap"],
  [recoveryControls, 'import "./reset-settings-ui.js";', "configured reset registration"],
  [recoveryControls, 'import "./session-pauses.js";', "temporary session recovery registration"],
  [settingsHtml, '<script type="module" src="recovery-bootstrap.js"></script>', "explicit Settings recovery bootstrap"],
  [session, 'type: "drop-ads:set-session-site-paused"', "reviewed session recovery transaction"],
  [session, "async function resumeAllSessionPauses()", "bulk session recovery"],
  [session, "function restoreResumeFocus(rowIndex)", "session recovery focus"],
  [session, "let recoveryMutationActive = false", "shared recovery single-flight owner"],
  [session, "SESSION_STORAGE_KEY", "canonical session storage identity"],
  [resetUi, 'confirmation.id = "reset-settings-confirmation"', "inline reset confirmation"],
  [resetUi, "function cancelConfiguredReset()", "reset cancellation"],
  [resetUi, "function setResetBusy(busy)", "reset busy ownership"],
  [sessionAudit, "settings-session-recovery-audit: Settings session recovery invariants verified", "session recovery executable gate"],
  [resetAudit, "settings-reset-audit", "configured reset executable gate"]
]) requireText(source, needle, label);

rejectMatch(session + resetUi, /localStorage|indexedDB|sendBeacon|analytics|telemetry\s*\(/i, "retained tracking/activity API in Settings recovery");
rejectMatch(resetUi, /globalThis\.confirm|window\.confirm/, "native blocking reset confirmation");

// Recovery ownership is verified against current source/audit wiring above; deleted
// historical milestone test files are not part of the current release contract.

if (packageJson.scripts?.["settings-recovery-controls-audit"] !== "node tools/settings-recovery-controls-audit.mjs") throw new Error("settings-recovery-controls-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run settings-recovery-controls-audit")) throw new Error("settings-recovery-controls-audit is not wired into npm run check");

console.log("settings-recovery-controls-audit: canonical Settings recovery controls verified through M857");
