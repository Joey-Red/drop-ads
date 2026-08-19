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

const session = read("src/core/session.js");

reject(session, /structuredClone\s*\(/, "ambient structuredClone session cloning");
reject(session, /api\.storage\.session\.(?:get|set)\s*\(/, "direct storage.session method access");

for (const [needle, label] of [
  ["const EMPTY_SESSION_COLLECTION = Object.freeze([])", "immutable session default collection"],
  ["return Object.freeze({ disabledSites: Object.freeze([]) })", "immutable fresh session snapshot"],
  ["const MAX_SESSION_COLLABORATOR_PROTOTYPE_DEPTH = 8", "bounded session collaborator traversal"],
  ["function captureSessionDataProperty(receiver, key, label, required = false)", "session data collaborator capture"],
  ["function captureSessionStorage(api)", "frozen session storage collaborator boundary"],
  ["Reflect.apply(callback, receiver, args)", "session receiver-preserving invocation"],
  ["if (stored === undefined) return cloneDefaultSessionState()", "strict absent session semantics"],
  ["return normalizeSessionState(stored, { strictShape: true })", "strict present session normalization"],
  ["function writableSessionStateSnapshot(state)", "canonical writable session boundary"],
  ["requires an own enumerable disabledSites data field", "required session write field"],
  ["for (const candidate of disabledSites) normalizeDomain(candidate)", "strict writable session domain validation"],
  ["function sessionStorageWritePayload(state)", "session write envelope constructor"],
  ["return Object.freeze({ [SESSION_STORAGE_KEY]: state })", "frozen session write envelope"],
  ["function sessionPauseSnapshot(state, domain, paused)", "immutable session pause snapshot"],
  ["return Object.freeze({ disabledSites: setSiteDisabled", "frozen session pause result"],
  ["return Object.freeze({ disabledSites: normalizeDomainSet(disabledSites) })", "immutable normalized session state"]
]) requireText(session, needle, label);

console.log("session-state-hardening-audit: immutable bounded session storage boundaries verified");
