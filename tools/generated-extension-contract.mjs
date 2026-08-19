import { CANONICAL_CONTENT_SCRIPT_FILES } from "./manifest-content-contract.mjs";

const MAX_GENERATED_CONTRACT_FILES = 4096;

export function snapshotGeneratedContractStringArray(source, label = "Generated extension contract array") {
  if (!Array.isArray(source)) throw new TypeError(`${label} must be an array`);
  const keys = Reflect.ownKeys(source);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(source, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0 || lengthDescriptor.value > MAX_GENERATED_CONTRACT_FILES) {
    throw new RangeError(`${label} length is invalid`);
  }
  const length = lengthDescriptor.value;
  if (keys.length !== length + 1 || keys.some((key) => {
    if (key === "length") return false;
    if (typeof key !== "string" || !/^(?:0|[1-9]\d*)$/.test(key)) return true;
    const index = Number(key);
    return !Number.isSafeInteger(index) || index < 0 || index >= length || String(index) !== key;
  })) {
    throw new TypeError(`${label} must be a dense array with no extra own keys`);
  }
  const values = new Array(length);
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(source, String(index));
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") {
      throw new TypeError(`${label} must contain only own string data fields`);
    }
    values[index] = descriptor.value;
  }
  return Object.freeze(values);
}

const CONTENT_SCRIPT_FILES = snapshotGeneratedContractStringArray(CANONICAL_CONTENT_SCRIPT_FILES, "Canonical content-script files");

const CORE_FILES = Object.freeze([
  "core/action-count.js",
  "core/background-bootstrap.js",
  "core/cache-codec.js",
  "core/cache-storage.js",
  "core/community-boundary.js",
  "core/community-issue.js",
  "core/community.js",
  "core/context-feedback.js",
  "core/cookie-banner-runtime.js",
  "core/cookie-banner-site-policy.js",
  "core/cosmetic-lists.js",
  "core/cosmetic-rules.js",
  "core/cosmetic-runtime.js",
  "core/country-policy.js",
  "core/import-guard.js",
  "core/list-limits.js",
  "core/list-updates.js",
  "core/lists.js",
  "core/message-contract.js",
  "core/object-schema.js",
  "core/options-boundary.js",
  "core/options-runtime.js",
  "core/options-storage-listener.js",
  "core/personal-rules.js",
  "core/policy-convergence.js",
  "core/popup-boundary.js",
  "core/refresh-watchdog.js",
  "core/rule-conflicts.js",
  "core/rules.js",
  "core/runtime.js",
  "core/session-recovery-response.js",
  "core/session.js",
  "core/settings-backup.js",
  "core/settings-reset-message.js",
  "core/settings-reset-operation.js",
  "core/settings-reset-response.js",
  "core/settings-reset-runtime.js",
  "core/settings-reset.js",
  "core/state-limits.js",
  "core/storage.js",
  "core/subscriptions.js",
  "core/tab-fanout.js",
  "core/text-order.js",
  "core/ui-commit-status.js"
]);

const OPTIONS_FILES = Object.freeze([
  "options/action-count.js",
  "options/community-ui.js",
  "options/cookie-banner-settings.js",
  "options/cosmetics.js",
  "options/country.js",
  "options/disabled-site-feedback.js",
  "options/dynamic-list-semantics.js",
  "options/form-state-semantics.js",
  "options/index.html",
  "options/list-filter-ergonomics.js",
  "options/list-filter-landmarks.js",
  "options/list-filter-no-match.js",
  "options/list-filter.css",
  "options/list-filter.js",
  "options/mutation-target-semantics.js",
  "options/options.css",
  "options/options.js",
  "options/personal-mutation-feedback.js",
  "options/policy-row-semantics.js",
  "options/recovery-bootstrap.js",
  "options/recovery-controls.js",
  "options/reset-settings-ui.js",
  "options/session-pauses.js",
  "options/subscription-presentation.js",
  "options/ui-semantics.js"
]);

const POPUP_FILES = Object.freeze([
  "popup/index.html",
  "popup/popup-busy-semantics.js",
  "popup/popup-engine-state.js",
  "popup/popup-global-semantics.js",
  "popup/popup-keyboard.js",
  "popup/popup-semantics.js",
  "popup/popup-settings-early.js",
  "popup/popup-shortcuts.js",
  "popup/popup.css",
  "popup/popup.js",
  "popup/shortcut-availability.js",
  "popup/shortcut-bindings.js",
  "popup/shortcut-catalog.js",
  "popup/shortcut-help-contract.js"
]);

export const COMMON_GENERATED_EXTENSION_FILES = snapshotGeneratedContractStringArray([
  "background.js",
  "build-info.json",
  "manifest.json",
  ...CONTENT_SCRIPT_FILES,
  ...CORE_FILES,
  "lists/default.meta.json",
  "lists/default.txt",
  ...OPTIONS_FILES,
  ...POPUP_FILES
].sort(), "Common generated extension files");

export const BROWSER_GENERATED_EXTENSION_FILES = Object.freeze({
  chromium: snapshotGeneratedContractStringArray([...COMMON_GENERATED_EXTENSION_FILES], "Chromium generated extension files"),
  firefox: snapshotGeneratedContractStringArray([...COMMON_GENERATED_EXTENSION_FILES, "rules/static.json"].sort(), "Firefox generated extension files")
});

export function generatedExtensionFilesForBrowser(browser) {
  const files = BROWSER_GENERATED_EXTENSION_FILES[browser];
  if (!files) throw new Error(`Unsupported generated extension target: ${browser}`);
  return files;
}
