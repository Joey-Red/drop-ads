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

const storage = read("src/core/storage.js");
const personal = read("src/core/personal-rules.js");

reject(storage, /structuredClone\s*\(/, "ambient structuredClone state cloning");
reject(storage, /api\.storage\.local\.(?:get|set)\s*\(/, "direct storage.local method access");

for (const [needle, label] of [
  ["const MAX_STORAGE_COLLABORATOR_PROTOTYPE_DEPTH = 8", "bounded storage collaborator traversal"],
  ["function captureReceiverData(receiver, key, label)", "storage data collaborator capture"],
  ["function captureReceiverMethod(receiver, key, label)", "storage method collaborator capture"],
  ["Reflect.apply(callback, receiver, args)", "storage receiver-preserving invocation"],
  ["async function storageGet(api, key)", "hardened storage get wrapper"],
  ["async function storageSet(api, payload)", "hardened storage set wrapper"],
  ["if (stored === undefined) return cloneDefaultState()", "strict absent state load semantics"],
  ["if (stored !== undefined)", "strict absent state initialization semantics"],
  ["return normalizePersistedState(snapshot)", "canonical persisted state writes"],
  ["return Object.freeze({", "immutable normalized state"],
  ["function freezeNormalizedCacheSnapshot", "immutable normalized cache traversal"],
  ["MAX_LIST_CACHE_JSON_NODES", "cache freeze node ceiling"],
  ["MAX_LIST_CACHE_JSON_DEPTH", "cache freeze depth ceiling"],
  ["cache === undefined ? Object.create(null) : cache", "strict absent cache semantics"],
  ["candidate === null", "present null cache rejection"],
  ["return freezeNormalizedCacheSnapshot(normalized)", "frozen cache storage snapshot"]
]) requireText(storage, needle, label);

for (const [needle, label] of [
  ["const EMPTY_PERSONAL_COLLECTION = Object.freeze([])", "immutable personal empty collection"],
  ["function frozenNormalizedRule(candidate)", "immutable personal rule normalizer"],
  ["Object.freeze([...rule.resourceTypes])", "immutable personal resource types"],
  ["return Object.freeze(candidates.map(frozenNormalizedRule))", "immutable personal input snapshot"],
  ["return Object.freeze([...current, normalized])", "immutable personal add result"],
  ["return Object.freeze(current.filter", "immutable personal remove result"],
  ["return Object.freeze([...normalized].sort())", "immutable normalized domain set"],
  ["return Object.freeze([...next].sort())", "immutable domain flag result"]
]) requireText(personal, needle, label);

console.log("storage-state-hardening-audit: immutable bounded storage and personal-policy boundaries verified");
