import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function rejectText(source, needle, label) {
  if (source.includes(needle)) throw new Error(`${label} is forbidden`);
}

const session = read("src/options/session-pauses.js");
const filters = read("src/options/list-filter.js");
const landmarks = read("src/options/list-filter-landmarks.js");

for (const [source, needle, label] of [
  [landmarks, 'import "./session-pauses.js";', "session recovery landmark ordering"],
  [filters, 'import "./session-pauses.js";', "session recovery filter ordering"],
  [filters, '{ listId: "session-pauses-list", label: "Filter temporary session pauses" }', "session pause filter scope"],
  [filters, "Filters only this Settings page and is not saved.", "transient filter privacy guidance"],
  [session, "SESSION_STORAGE_KEY", "canonical session storage key"],
  [session, "loadSessionState", "canonical session state reader"],
  [session, "installOwnedOptionsStorageListener", "owned session storage listener"],
  [session, 'areaName !== "session"', "session-area change filter"],
  [session, "internalMutationDepth > 0", "self-mutation suppression"],
  [session, "sendOptionsRuntimeMessage", "captured options runtime sender"],
  [session, 'type: "drop-ads:set-session-site-paused"', "exact session recovery message type"],
  [session, "paused: false", "resume-only session mutation"],
  [session, "unwrapOptionsRuntimeResponse", "strict session recovery response validation"],
  [session, 'resume.textContent = "Resume protection";', "explicit session recovery action"],
  [session, "function restoreResumeFocus(rowIndex)", "session recovery focus restoration"],
  [session, 'heading.focus({ preventScroll: true });', "final-row heading focus"],
  [session, "let busyDepth = 0;", "overlap-safe session busy depth"],
  [session, "function beginSessionBusy()", "owned session busy helper"],
  [session, 'section.setAttribute("aria-busy", "true");', "session section busy publication"],
  [session, 'section.removeAttribute("aria-busy");', "session section busy cleanup"],
  [session, "renderGeneration += 1;", "teardown generation invalidation"],
  [session, "disposeStorageSync?.();", "owned storage-listener teardown"]
]) requireText(source, needle, label);

for (const forbidden of [
  "localStorage",
  "indexedDB",
  "sendBeacon",
  "XMLHttpRequest",
  "declarativeNetRequestFeedback",
  "browsingHistory"
]) rejectText(session, forbidden, `session recovery persistent/tracking surface ${forbidden}`);

for (const path of [
  "tests/settings-session-recovery-v839.test.js",
  "tests/settings-session-recovery-action-v840.test.js",
  "tests/settings-session-recovery-sync-v841.test.js",
  "tests/settings-session-recovery-focus-v842.test.js",
  "tests/settings-session-recovery-busy-v843.test.js",
  "tests/settings-session-recovery-runtime-v849.test.js"
]) {
  if (!fs.existsSync(new URL(`../${path}`, import.meta.url))) throw new Error(`required session recovery regression is missing: ${path}`);
}

console.log("session-recovery-hardening-audit: canonical runtime boundary verified through M849");
