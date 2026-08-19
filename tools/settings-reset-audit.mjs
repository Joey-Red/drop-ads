import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }
function rejectMatch(source, pattern, label) { if (pattern.test(source)) throw new Error(`${label} is forbidden`); }

const state = read("src/core/settings-reset.js");
const operation = read("src/core/settings-reset-operation.js");
const message = read("src/core/settings-reset-message.js");
const response = read("src/core/settings-reset-response.js");
const runtime = read("src/core/settings-reset-runtime.js");
const background = read("src/background.js");
const ui = read("src/options/reset-settings-ui.js");
const sessionUi = read("src/options/session-pauses.js");
const recoveryBootstrap = read("src/options/recovery-bootstrap.js");
const recoveryControls = read("src/options/recovery-controls.js");
const settingsHtml = read("src/options/index.html");
const boundary = read("docs/SETTINGS_RESET_BOUNDARY.md");
const packageJson = JSON.parse(read("package.json"));

for (const [source, needle, label] of [
  [state, "createConfiguredResetState()", "configured reset state factory"],
  [state, "normalizeSubscriptions(DEFAULT_STATE.subscriptions)", "fresh default subscription normalization"],
  [operation, "createSettingsBackup(createConfiguredResetState())", "strict reset backup construction"],
  [operation, "MAX_SETTINGS_BACKUP_BYTES", "configured reset serialization byte ceiling"],
  [operation, "serializeConfiguredResetBackup(backup)", "bounded reset backup serializer"],
  [operation, "MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH = 8", "bounded reset collaborator inspection"],
  [operation, 'Object.getOwnPropertyDescriptor(current, "importSettingsBackup")', "descriptor-safe reset transaction capture"],
  [operation, "Reflect.apply(descriptor.value, core, args)", "receiver-preserving reset transaction call"],
  [operation, "await importSettingsBackup(backupText)", "serialized transactional reset delegation"],
  [operation, "Object.freeze({ changed: true })", "privacy-minimal immutable reset result"],
  [message, 'SETTINGS_RESET_MESSAGE_TYPE = "drop-ads:reset-settings"', "fixed reset message type"],
  [message, "Reflect.ownKeys(message)", "descriptor-safe exact reset message inspection"],
  [response, "export function unwrapSettingsResetResponse", "dedicated reset response boundary"],
  [response, 'exactPlainObject(result, ["changed"], "Settings reset result")', "exact reset result schema"],
  [response, "MAX_RESET_ERROR_CHARS = 1_024", "bounded reset failure text"],
  [runtime, "validateSettingsResetMessage(message)", "dedicated reset validation"],
  [runtime, "resetConfiguredSettings(core)", "reset runtime delegation"],
  [background, '{ name: "settings-reset", install: (runtime) => installSettingsResetRuntime({ api, core: runtime }) }', "reset feature bootstrap"],
  [recoveryBootstrap, 'import "./recovery-controls.js";', "central Settings recovery bootstrap"],
  [recoveryControls, 'import "./reset-settings-ui.js";', "configured reset recovery registration"],
  [recoveryControls, 'import "./session-pauses.js";', "session pause recovery registration"],
  [settingsHtml, '<script type="module" src="recovery-bootstrap.js"></script>', "first Settings recovery bootstrap script"],
  [sessionUi, "function ensureSessionPauseNavLink()", "idempotent session recovery navigation"],
  [sessionUi, "function ensureSessionPauseSection()", "idempotent session recovery section"],
  [sessionUi, "function restoreResumeFocus(rowIndex)", "per-site session recovery focus"],
  [sessionUi, "if (failed && resumeAll.isConnected && !resumeAll.disabled) resumeAll.focus();", "bulk recovery failure focus"],
  [sessionUi, "renderGeneration += 1", "session recovery teardown invalidation"],
  [ui, 'section.id = "reset-settings-section"', "first-class reset Settings section"],
  [ui, 'confirmation.id = "reset-settings-confirmation"', "inline reset confirmation surface"],
  [ui, 'confirmation.setAttribute("aria-keyshortcuts", "Escape")', "explicit reset Escape shortcut"],
  [ui, 'sendOptionsRuntimeMessage(api, { type: "drop-ads:reset-settings" })', "no-payload reset request"],
  [ui, 'unwrapSettingsResetResponse(response, "Could not reset configured settings")', "exact reset response consumption"],
  [ui, 'resetConfirmButton.setAttribute("aria-busy", "true")', "reset confirmation busy state"],
  [ui, "(succeeded ? resetButton : resetConfirmButton).focus();", "reset completion focus recovery"],
  [ui, 'resetStatus.textContent = "Configured settings reset cancelled."', "explicit mutation-free cancellation status"],
  [ui, "Temporary session pauses are separate ephemeral recovery state and are not cleared by this action.", "session-preservation UI contract"],
  [ui, "Drop Ads does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry.", "reset privacy contract"],
  [boundary, "`storage.session`", "documented session storage separation"],
  [boundary, "Temporary per-site session pauses remain ephemeral", "documented session preservation"],
  [boundary, "No reset log/history is stored", "documented no-history boundary"]
]) requireText(source, needle, label);

rejectMatch(ui, /globalThis\.confirm|window\.confirm/, "native blocking reset confirmation");
rejectMatch(ui, /unwrapOptionsRuntimeResponse/, "generic configured-reset result acceptance");
rejectMatch(operation, /typeof core\.importSettingsBackup|core\.importSettingsBackup\(/, "unsafe reset transaction property access");
rejectMatch(operation, /saveSessionState|storage\.session|SESSION_STORAGE_KEY/, "session mutation from configured reset operation");
rejectMatch(runtime, /sourceUrl|personalBlock|personalAllow|disabledSites/, "private configured policy in reset runtime responses");
rejectMatch(state, /structuredClone/, "ambient clone in reset state factory");

// The live configured/session reset boundary is audited directly above. Historical
// milestone test filenames are intentionally not required by this source gate.

if (packageJson.scripts?.["settings-reset-audit"] !== "node tools/settings-reset-audit.mjs") throw new Error("settings-reset-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run settings-reset-audit")) throw new Error("settings-reset-audit is not wired into npm run check");

console.log("settings-reset-audit: canonical configured/session recovery invariants verified through M857");
