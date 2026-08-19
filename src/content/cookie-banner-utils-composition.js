(() => {
  const UTILS_GLOBAL = "DropAdsCookieBannerUtils";
  const COMPOSITION_GLOBAL = "DropAdsCookieBannerUtilsComposition";
  const MAX_OVERRIDE_KEYS = 4;
  const EXPECTED_UTIL_KEYS = Object.freeze([
    "MAX_COOKIE_BANNER_SCAN_NODES",
    "MAX_COOKIE_BANNER_CANDIDATES",
    "MAX_COOKIE_BANNER_TEXT_CHARS",
    "MAX_ACTION_TEXT_NODES",
    "MAX_ACTION_RAW_CHARS",
    "MAX_ARIA_LABELLEDBY_IDS",
    "MAX_ARIA_LABELLEDBY_ATTR_CHARS",
    "MAX_ARIA_REFERENCE_TEXT_NODES",
    "MAX_ARIA_REFERENCE_RAW_CHARS",
    "MAX_CONSENT_ANCESTOR_STEPS",
    "MAX_CONSENT_TEXT_NODES",
    "MAX_CONSENT_CONTEXT_CHARS",
    "MAX_CONSENT_RAW_FIELD_CHARS",
    "MAX_CONSENT_CONTEXT_EVALUATIONS",
    "MAX_COOKIE_BANNER_SHADOW_ROOTS",
    "MAX_COOKIE_BANNER_SHADOW_DEPTH",
    "textSnapshot",
    "labelledBySnapshot",
    "normalizedActionText",
    "rejectionScore",
    "isDropAdsOwned",
    "isNavigationLike",
    "isButtonLike",
    "boundedConsentContext",
    "findConsentContainer",
    "discoverActionCandidates",
    "snapshotCandidate",
    "snapshotCandidateArray",
    "selectRejectionCandidate"
  ]);
  const EXPECTED_UTIL_KEY_SET = new Set(EXPECTED_UTIL_KEYS);

  function ownDataDescriptor(object, key) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
    catch { return null; }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) return null;
    return descriptor;
  }

  function snapshotUtils() {
    let globalDescriptor;
    try { globalDescriptor = Object.getOwnPropertyDescriptor(globalThis, UTILS_GLOBAL); }
    catch { return null; }
    if (!globalDescriptor || !("value" in globalDescriptor) || globalDescriptor.get || globalDescriptor.set) return null;
    const utils = globalDescriptor.value;
    let prototype;
    let keys;
    let frozen;
    try {
      prototype = Object.getPrototypeOf(utils);
      keys = Reflect.ownKeys(utils);
      frozen = Object.isFrozen(utils);
    } catch { return null; }
    if (!utils || typeof utils !== "object" || prototype !== Object.prototype || !frozen) return null;
    if (keys.length !== EXPECTED_UTIL_KEYS.length || keys.some((key) => typeof key !== "string" || !EXPECTED_UTIL_KEY_SET.has(key))) return null;

    const values = Object.create(null);
    for (const key of EXPECTED_UTIL_KEYS) {
      const descriptor = ownDataDescriptor(utils, key);
      if (!descriptor || !descriptor.enumerable || descriptor.writable || descriptor.configurable) return null;
      values[key] = descriptor.value;
    }
    return Object.freeze(values);
  }

  function snapshotOverrides(overrides) {
    if (!overrides || typeof overrides !== "object") return null;
    let prototype;
    let keys;
    try { prototype = Object.getPrototypeOf(overrides); keys = Reflect.ownKeys(overrides); }
    catch { return null; }
    if (prototype !== Object.prototype && prototype !== null) return null;
    if (!keys.length || keys.length > MAX_OVERRIDE_KEYS) return null;
    if (keys.some((key) => typeof key !== "string" || !EXPECTED_UTIL_KEY_SET.has(key))) return null;
    const values = Object.create(null);
    for (const key of keys) {
      const descriptor = ownDataDescriptor(overrides, key);
      if (!descriptor || !descriptor.enumerable) return null;
      values[key] = descriptor.value;
    }
    return Object.freeze(values);
  }

  function replaceUtils(overrides) {
    const current = snapshotUtils();
    const replacements = snapshotOverrides(overrides);
    if (!current || !replacements) return null;

    const next = {};
    for (const key of EXPECTED_UTIL_KEYS) {
      const value = Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : current[key];
      Object.defineProperty(next, key, {
        value,
        enumerable: true,
        writable: false,
        configurable: false
      });
    }
    Object.freeze(next);

    try {
      Object.defineProperty(globalThis, UTILS_GLOBAL, {
        value: next,
        enumerable: true,
        writable: true,
        configurable: true
      });
    } catch { return null; }
    return next;
  }

  let existing;
  try { existing = Object.getOwnPropertyDescriptor(globalThis, COMPOSITION_GLOBAL); }
  catch { return; }
  if (existing) return;

  const api = Object.freeze({
    EXPECTED_UTIL_KEYS,
    snapshotUtils,
    replaceUtils
  });
  try {
    Object.defineProperty(globalThis, COMPOSITION_GLOBAL, {
      value: api,
      enumerable: false,
      writable: false,
      configurable: false
    });
  } catch {
    // Fail closed: later hardening layers will decline to compose without this helper.
  }
})();
