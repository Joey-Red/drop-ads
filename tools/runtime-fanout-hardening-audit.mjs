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

const fanout = read("src/core/tab-fanout.js");
const runtime = read("src/core/cosmetic-runtime.js");
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ["MAX_TAB_MESSAGE_TARGETS = 10_000", "explicit fanout target ceiling"],
  ["MAX_TAB_FANOUT_MESSAGE_DEPTH = 8", "fanout message depth ceiling"],
  ["MAX_TAB_FANOUT_MESSAGE_NODES = 4_096", "fanout message node ceiling"],
  ["MAX_TAB_FANOUT_MESSAGE_KEYS = 128", "fanout message field ceiling"],
  ["MAX_TAB_FANOUT_MESSAGE_ARRAY_ITEMS = 1_024", "fanout message array ceiling"],
  ["MAX_TAB_FANOUT_MESSAGE_TEXT_CHARS = 256 * 1024", "fanout message text ceiling"],
  ["snapshotDenseDataArray(tabs, \"Tab fanout tabs\", MAX_TAB_MESSAGE_TARGETS)", "bounded fanout target snapshot"],
  ["Object.getOwnPropertyDescriptor(value, key)", "descriptor-only fanout message fields"],
  ["Object.freeze({ attempted, failed })", "immutable fanout result"],
  ["return Object.freeze(result);", "immutable fanout message containers"]
]) requireText(fanout, needle, label);
rejectText(fanout, "structuredClone", "structuredClone fanout message capture");

for (const [needle, label] of [
  ["let refreshQueued = false", "cosmetic refresh queued state"],
  ["let refreshDirty = false", "cosmetic refresh dirty state"],
  ["function scheduleRefresh()", "cosmetic refresh scheduler"],
  ["do {", "dirty-aware refresh loop"],
  ["if (needsFollowUp) scheduleRefresh();", "refresh follow-up recovery"],
  ["scheduleRefresh();", "storage-driven refresh scheduling"],
  ["function cosmeticPolicyResult(enabled, selectors = [])", "cosmetic policy result constructor"],
  ["Object.freeze({ enabled: false, selectorCount: 0, stylesheet: \"\" })", "immutable disabled cosmetic policy"],
  ["return Object.freeze({", "immutable enabled cosmetic policy"]
]) requireText(runtime, needle, label);

if (packageJson.scripts?.["runtime-fanout-hardening-audit"] !== "node tools/runtime-fanout-hardening-audit.mjs") {
  throw new Error("runtime-fanout-hardening-audit package script is missing");
}
if (!packageJson.scripts?.check?.includes("npm run runtime-fanout-hardening-audit")) {
  throw new Error("runtime-fanout-hardening-audit is not part of npm run check");
}

console.log("runtime-fanout-hardening-audit: bounded descriptor-safe fanout and cosmetic refresh lifecycle verified");
