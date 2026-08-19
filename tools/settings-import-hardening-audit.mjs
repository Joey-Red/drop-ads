import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} is forbidden`);
}

const importGuard = read("src/core/import-guard.js");
const backup = read("src/core/settings-backup.js");

for (const [needle, label] of [
  ["decoded.sourceKey !== expectedSourceKey", "source-bound import cache reuse"],
  ["return Object.freeze(pending)", "immutable import activation result"],
  ["const IMPORT_MESSAGE_KEYS = new Set([\"type\", \"backupText\"])", "exact import message schema"],
  ["return Object.freeze({ type: type.value, backupText: backup.value })", "immutable import message snapshot"],
  ["return Object.freeze({ ok: false, error: importGuardFailureMessage(error) })", "immutable import failure envelope"]
]) requireText(importGuard, needle, label);

for (const [needle, label] of [
  ["return freezeCanonicalData(assertSerializedBackupBound", "immutable exported settings backup"],
  ["return freezeCanonicalData({", "immutable parsed settings state"],
  ["const REQUIRED_IMPORT_SETTINGS_KEYS", "explicit required import fields"],
  ["Settings backup repeats built-in subscription id", "duplicate built-in rejection"],
  ["Settings backup repeats an external subscription source", "duplicate external source rejection"],
  ["duplicates a canonical built-in source", "built-in source alias rejection"],
  ["contains a duplicate canonical rule", "duplicate network rule rejection"],
  ["contains a duplicate canonical cosmetic rule", "duplicate cosmetic rule rejection"],
  ["contains a duplicate canonical domain", "duplicate domain rejection"]
]) requireText(backup, needle, label);

for (const [source, label] of [[importGuard, "import guard"], [backup, "settings backup"]]) {
  reject(source, /requestHistory|pageHtml|elementHistory|blockedCount|deviceIdentifier|telemetry|analytics/i, `${label} privacy-retention surface`);
}

// Historical test-file presence is not a source-hardening invariant. npm test owns
// executable regression coverage; this audit validates the live import/export boundary.

console.log("settings-import-hardening-audit: provenance-safe immutable bounded settings import/export boundaries verified");
