import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function rejectPattern(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} must not use direct browser collaborator access`);
}

const popup = read("src/popup/popup.js");
const popupBoundary = read("src/core/popup-boundary.js");

for (const [pattern, label] of [
  [/api\.tabs\.query\s*\(/, "popup active-tab query"],
  [/api\.tabs\.sendMessage\s*\(/, "popup top-frame messaging"],
  [/api\.runtime\.sendMessage\s*\(/, "popup runtime messaging"],
  [/api\.runtime\.openOptionsPage\s*\(/, "popup Settings opener"],
  [/api\.storage\.onChanged\.addListener\s*\(/, "popup storage live-sync"]
]) rejectPattern(popup, pattern, label);

for (const [needle, label] of [
  ["sendPopupRuntimeMessage(api, message)", "captured popup runtime sender"],
  ["queryPopupActiveTab(api)", "captured popup active-tab query"],
  ["sendPopupTopFrameMessage(api, currentTabId", "captured popup top-frame sender"],
  ["openPopupOptionsPage(api)", "captured popup Settings opener"],
  ["installPopupStorageListener(api,", "captured popup storage listener"],
  ["let disposeStorageLiveSync = null", "popup storage disposer ownership"],
  ["window.addEventListener(\"pagehide\"", "popup pagehide teardown"],
  ["disposeStorageLiveSync?.()", "popup storage listener disposal"],
  ["let committedRenderGeneration = 0", "popup committed-render generation"],
  ["const generation = ++committedRenderGeneration", "popup committed-render generation claim"],
  ["if (!pageActive || generation !== committedRenderGeneration) return false", "popup stale committed-render rejection"],
  ["if (pageActive && published) clearGlobalStatus(revision)", "popup published-render status clearing"]
]) requireText(popup, needle, label);

for (const [needle, label] of [
  ["capturePopupCollaboratorValue(onChanged, \"removeListener\"", "captured popup removeListener"],
  ["let active = true", "idempotent popup listener disposer state"],
  ["Reflect.apply(removeListener, onChanged, [listener])", "receiver-preserving popup listener removal"],
  ["MAX_POPUP_RUNTIME_ERROR_CHARS = 1_024", "popup runtime error ceiling"],
  ["UNSAFE_POPUP_ERROR_TEXT = /[\\u0000-\\u001f\\u007f\\u2028\\u2029]/", "popup unsafe error-text class"],
  ["function isPopupErrorTextSafe(value)", "shared popup error-text predicate"],
  ["return isPopupErrorTextSafe(descriptor.value) ? descriptor.value : safeFallback", "caught popup error sanitization"],
  ["errorField.present && isPopupErrorTextSafe(errorField.value)", "runtime popup error sanitization"],
  ["Object.freeze({ active: true, currentWindow: true })", "frozen popup active-tab query envelope"],
  ["Reflect.apply(query, tabs, [queryInfo])", "receiver-preserving popup active-tab query"],
  ["if (!Number.isSafeInteger(tabId) || tabId < 0)", "popup top-frame tab-id validation"],
  ["Object.freeze({ frameId: 0 })", "frozen popup top-frame options"],
  ["Reflect.apply(sendMessage, tabs, [tabId, message, options])", "receiver-preserving popup top-frame dispatch"]
]) requireText(popupBoundary, needle, label);

const settingsPaths = [
  "src/options/options.js",
  "src/options/country.js",
  "src/options/cosmetics.js",
  "src/options/action-count.js"
];
for (const path of settingsPaths) {
  const source = read(path);
  rejectPattern(source, /api\.storage\.onChanged\.addListener\s*\(/, `${path} storage live-sync`);
  rejectPattern(source, /installOptionsStorageListener\s*\(/, `${path} legacy storage listener`);
  requireText(source, "installOwnedOptionsStorageListener(api,", `${path} owned storage-listener helper`);
  requireText(source, "let disposeStorageLiveSync = null", `${path} storage disposer ownership`);
  requireText(source, "window.addEventListener(\"pagehide\"", `${path} pagehide teardown`);
  requireText(source, "disposeStorageLiveSync?.()", `${path} storage listener disposal`);
}

const primaryOptions = read("src/options/options.js");
for (const [needle, label] of [
  ["sendOptionsRuntimeMessage(api,", "primary Settings captured runtime sender"],
  ["let pageActive = true", "primary Settings page lifecycle flag"],
  ["pageActive = false", "primary Settings pagehide invalidation"],
  ["if (!pageActive || renderQueued) return", "primary Settings render queue admission guard"],
  ["if (!pageActive) return false", "primary Settings post-await publication guard"]
]) requireText(primaryOptions, needle, label);
rejectPattern(primaryOptions, /api\.runtime\.sendMessage\s*\(/, "primary Settings runtime messaging");

const ownedStorage = read("src/core/options-storage-listener.js");
for (const [needle, label] of [
  ["MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH", "owned Settings storage collaborator depth bound"],
  ["Object.getOwnPropertyDescriptor(current, key)", "owned Settings storage data-property capture"],
  ["captureOptionsStorageCollaboratorValue(onChanged, \"addListener\"", "owned Settings addListener capture"],
  ["captureOptionsStorageCollaboratorValue(onChanged, \"removeListener\"", "owned Settings removeListener capture"],
  ["Reflect.apply(addListener, onChanged, [listener])", "owned Settings listener registration receiver"],
  ["let active = true", "owned Settings disposer idempotence"],
  ["Reflect.apply(removeListener, onChanged, [listener])", "owned Settings listener removal receiver"]
]) requireText(ownedStorage, needle, label);

const actionCount = read("src/options/action-count.js");
for (const [needle, label] of [
  ["let committedRefreshGeneration = 0", "action-count refresh generation"],
  ["const generation = ++committedRefreshGeneration", "action-count refresh generation claim"],
  ["if (!pageActive || generation !== committedRefreshGeneration || internalMutationDepth !== 0) return false", "action-count stale refresh/pagehide rejection"],
  ["committedRefreshGeneration += 1", "action-count direct-mutation/teardown refresh invalidation"]
]) requireText(actionCount, needle, label);

const country = read("src/options/country.js");
for (const [needle, label] of [
  ["let renderGeneration = 0", "Country render generation"],
  ["const generation = ++renderGeneration", "Country render generation claim"],
  ["if (!pageActive || generation !== renderGeneration) return false", "Country stale render/pagehide rejection"],
  ["latestState = state", "Country accepted-state publication"],
  ["schedulePersonalListRelabel()", "Country accepted-render relabel scheduling"],
  ["sendOptionsRuntimeMessage(api, message)", "Country captured runtime sender"],
  ["let personalListObserver = null", "Country observer ownership"],
  ["personalListObserver = new MutationObserver(() => schedulePersonalListRelabel())", "Country observer coalesced routing"],
  ["personalListObserver?.disconnect()", "Country observer pagehide disconnect"],
  ["let relabelQueued = false", "Country relabel queue identity"],
  ["let pageActive = true", "Country page lifecycle flag"],
  ["pageActive = false", "Country pagehide invalidation"],
  ["renderGeneration += 1", "Country pagehide render-generation invalidation"],
  ["if (!pageActive || renderQueued) return", "Country render queue admission guard"],
  ["if (!pageActive || relabelQueued) return", "Country relabel queue admission guard"]
]) requireText(country, needle, label);
rejectPattern(country, /api\.runtime\.sendMessage\s*\(/, "Country Settings runtime messaging");

const cosmetics = read("src/options/cosmetics.js");
for (const [needle, label] of [
  ["let renderGeneration = 0", "Cosmetic Settings render generation"],
  ["const generation = ++renderGeneration", "Cosmetic Settings generation claim"],
  ["if (!pageActive || generation !== renderGeneration) return false", "Cosmetic Settings stale render/pagehide rejection"],
  ["renderList(hideList, state.personalCosmeticHide", "Cosmetic hide-list committed render"],
  ["renderList(allowList, state.personalCosmeticAllow", "Cosmetic allow-list committed render"],
  ["sendOptionsRuntimeMessage(api, message)", "Cosmetic Settings captured runtime sender"],
  ["let pageActive = true", "Cosmetic Settings page lifecycle flag"],
  ["pageActive = false", "Cosmetic Settings pagehide invalidation"],
  ["renderGeneration += 1", "Cosmetic Settings render-generation invalidation"],
  ["if (!pageActive || renderQueued) return", "Cosmetic Settings render queue admission guard"]
]) requireText(cosmetics, needle, label);
rejectPattern(cosmetics, /api\.runtime\.sendMessage\s*\(/, "Cosmetic Settings runtime messaging");

const optionsRuntime = read("src/core/options-runtime.js");
for (const [needle, label] of [
  ["MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH", "Settings runtime collaborator depth bound"],
  ["MAX_SETTINGS_RUNTIME_MESSAGE_FIELDS = 8", "Settings runtime message field ceiling"],
  ["Object.getOwnPropertyDescriptor(current, key)", "Settings runtime collaborator data-property capture"],
  ["prototype = Object.getPrototypeOf(message)", "Settings runtime message prototype inspection"],
  ["keys = Reflect.ownKeys(message)", "Settings runtime message own-key inspection"],
  ["Object.getOwnPropertyDescriptor(message, key)", "Settings runtime message field descriptor inspection"],
  ["const snapshot = Object.create(null)", "Settings runtime null-prototype message snapshot"],
  ["return Object.freeze(snapshot)", "Settings runtime frozen message snapshot"],
  ["normalizeOptionsRuntimeMessage(snapshotOptionsRuntimeMessage(message))", "Settings runtime snapshot-and-normalize before dispatch"],
  ["Reflect.apply(sendMessage, runtime, [safeMessage])", "receiver-preserving Settings runtime dispatch"]
]) requireText(optionsRuntime, needle, label);

console.log("ui-hardening-audit: popup and Settings collaborator/order/lifecycle/envelope invariants verified");
