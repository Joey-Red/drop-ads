import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

const selector = read("src/content/selector-utils.js");
const guard = read("src/content/picker-save-guard.js");
const picker = read("src/content/picker.js");
const chromium = JSON.parse(read("manifests/chromium.json"));
const firefox = JSON.parse(read("manifests/firefox.json"));
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ["const MAX_SELECTOR_LENGTH = 400;", "selector-length ceiling"],
  ["const MAX_DEPTH = 5;", "selector-depth ceiling"],
  ["const MAX_SIBLING_SCAN = 10_000;", "sibling-work ceiling"],
  ["const MAX_CLASS_TOKEN_SCAN = 64;", "bounded class-token scan"],
  ["const MAX_SELECTED_CLASS_TOKENS = 3;", "bounded selected class tokens"],
  ["const MAX_UNIQUENESS_PROBES = 32;", "bounded uniqueness probes"],
  ["const escaped = safeAscii ? char : `\\\\${code.toString(16)} `;", "bounded CSS escape chunk"],
  ["if (result.length + escaped.length > MAX_SELECTOR_LENGTH) throw new Error(`CSS escape output exceeds ${MAX_SELECTOR_LENGTH} characters`);", "CSS escape output ceiling"],
  ["const rawSnapshot = [];", "bounded DOM identity snapshot"],
  ["if (element.getAttribute !== getAttribute) return [];", "attribute collaborator revalidation"],
  ["if (raw !== rawSnapshot[index]) return [];", "attribute value revalidation"],
  ["if (element.classList !== classList || classList.length !== length) return [];", "class snapshot identity/length revalidation"],
  ["function stableToken(value)", "stable picker token admission"],
  ["if (/[/?#@=&%]/.test(value)) return null;", "URL-like identity rejection"],
  ["function extensionOwnedClassToken(token)", "extension-owned class boundary"],
  ["if (!token || extensionOwnedClassToken(token)) continue;", "extension helper-class exclusion"],
  ["tokens.sort(fixedCodeUnitCompare);", "deterministic class-token ordering"],
  ["function stableClassSelectorCandidates(element, tag)", "shortest deterministic class candidates"],
  ["function directIdentityCandidates(element, includeId = true)", "direct identity candidate boundary"],
  ["for (const attribute of stableAttributeSelectors(element)) candidates.push(`${tag}${attribute}`);", "reviewed attributes before class fallback"],
  ["candidates.push(...stableClassSelectorCandidates(element, tag));", "class candidates after reviewed attributes"],
  ["function selectorCarriesIdentity(part, element)", "bare-tag direct-selector rejection"],
  ["const duplicateId = directCandidates[0]?.startsWith(\"#\") === true;", "duplicate target id detection"],
  ["function stableIdIsUnique(element, documentRef, probe = unique)", "duplicate ancestor id boundary"],
  ["const includeId = depth === 0 ? !duplicateId : stableIdIsUnique(current, documentRef, probe);", "unique-only target/ancestor id admission"],
  ["let uniquenessProbeCount = 0;", "per-generation uniqueness counter"],
  ["Picker selector uniqueness probe limit exceeded", "uniqueness-probe fail-closed path"],
  ["const siblingSnapshot = [];", "structural sibling snapshot"],
  ["if (parent.children !== children || children.length !== length) throw new Error(\"Picker sibling list changed during selection\");", "sibling collection revalidation"],
  ["if (children[index] !== siblingSnapshot[index]) throw new Error(\"Picker sibling list changed during selection\");", "sibling entry revalidation"],
  ["function selectorUniquelyIdentifies(selector, element, documentRef = document)", "exact target revalidation helper"],
  ["if (element.isConnected !== true) return false;", "connected target revalidation"]
]) requireText(selector, needle, label);

for (const token of ["\\u034f", "\\u061c", "\\u180e", "\\u200b-\\u200f", "\\u202a-\\u202e", "\\u2060", "\\u2066-\\u2069", "\\ufeff"]) {
  requireText(selector, token, `invisible-token rejection ${token}`);
}

requireText(guard, "const CHANGED_SELECTION_ERROR = \"Picker selection changed; choose the element again\";", "reviewed stale-selection error");
requireText(guard, "const selectorUniquelyIdentifies = helpers.selectorUniquelyIdentifies;", "captured exact-target revalidation helper");
requireText(guard, "selectorUniquelyIdentifies(selector, target, documentRef)", "pre-save exact-target revalidation");
requireText(picker, "saveGuard.verifyCandidate(candidate, target, document);", "picker save guard invocation");
requireText(picker, "} catch (error) {\n          saving = false;", "retryable picker save failure");
requireText(picker, "bestEffortPickerDisabled(save, false);", "picker save retry control restore");
requireText(picker, "bestEffortPickerDisabled(cancel, false);", "picker cancel retry control restore");
const verifyIndex = picker.indexOf("saveGuard.verifyCandidate(candidate, target, document);");
const sendIndex = picker.indexOf("api.runtime.sendMessage({", verifyIndex);
if (verifyIndex < 0 || sendIndex <= verifyIndex) throw new Error("picker save guard must run before runtime mutation dispatch");

for (const manifest of [chromium, firefox]) {
  const scripts = manifest.content_scripts?.[0]?.js ?? [];
  const selectorIndex = scripts.indexOf("content/selector-utils.js");
  const guardIndex = scripts.indexOf("content/picker-save-guard.js");
  const pickerIndex = scripts.indexOf("content/picker.js");
  if (!(selectorIndex >= 0 && selectorIndex < guardIndex && guardIndex < pickerIndex)) throw new Error("picker selector/save-guard manifest order is invalid");
}

for (const forbidden of ["localStorage", "sessionStorage", "sendBeacon", "XMLHttpRequest", "WebSocket", "EventSource", "declarativeNetRequestFeedback", "analytics", "telemetry"]) {
  if (selector.includes(forbidden) || guard.includes(forbidden)) throw new Error(`picker selector boundary contains forbidden runtime surface: ${forbidden}`);
}

// Current selector/save hardening is verified directly above. Historical milestone
// test-file presence is intentionally not part of this source audit.

if (packageJson.scripts?.["picker-selector-hardening-audit"] !== "node tools/picker-selector-hardening-audit.mjs") throw new Error("picker-selector-hardening-audit package script is missing");
if (!packageJson.scripts?.check?.includes("npm run picker-selector-hardening-audit")) throw new Error("picker-selector-hardening-audit is not wired into npm run check");

console.log("picker-selector-hardening-audit: canonical picker selector/save invariants verified through M846");
