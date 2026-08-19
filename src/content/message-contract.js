(() => {
  const MAX_CONTEXT_TARGET_URL_CHARS = 16_384;
  const MAX_CONTENT_COSMETIC_SELECTORS = 2_048;
  const MAX_CONTENT_COSMETIC_STYLESHEET_BYTES = 256 * 1024;
  const MAX_CONTENT_RUNTIME_ERROR_CHARS = 1_024;
  const MAX_CONTENT_COSMETIC_SELECTOR_CHARS = 512;
  const MAX_CONTENT_COSMETIC_DOMAINS = 64;
  const MAX_CONTENT_DOMAIN_CHARS = 253;
  const COSMETIC_STYLESHEET_SUFFIX = " { display: none !important; }\n";
  const SCHEMAS = Object.freeze({
    "drop-ads:start-element-picker": Object.freeze({ keys: Object.freeze(["type"]) }),
    "drop-ads:cosmetic-refresh": Object.freeze({ keys: Object.freeze(["type"]) }),
    "drop-ads:cleanup-context-target": Object.freeze({ keys: Object.freeze(["type", "targetUrl"]), targetUrl: true })
  });

  function safeNonArrayObject(value) {
    if (!value || typeof value !== "object") return false;
    try {
      return !Array.isArray(value);
    } catch {
      return false;
    }
  }

  function ownDataField(value, key) {
    if (!safeNonArrayObject(value)) return { safe: false, present: false };
    let prototype;
    let descriptor;
    try {
      prototype = Object.getPrototypeOf(value);
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      return { safe: false, present: false };
    }
    if (prototype !== Object.prototype && prototype !== null) return { safe: false, present: false };
    if (!descriptor) return { safe: true, present: false };
    if (!descriptor.enumerable || !("value" in descriptor)) return { safe: false, present: true };
    return { safe: true, present: true, value: descriptor.value };
  }

  function exactOwnDataSnapshot(value, expectedKeys) {
    if (!safeNonArrayObject(value)) return null;
    let prototype;
    let keys;
    try {
      prototype = Object.getPrototypeOf(value);
      keys = Reflect.ownKeys(value);
    } catch {
      return null;
    }
    if (prototype !== Object.prototype && prototype !== null) return null;
    if (keys.length !== expectedKeys.length || keys.some((key) => typeof key !== "string" || !expectedKeys.includes(key))) return null;

    const detached = Object.create(null);
    for (const key of expectedKeys) {
      const field = ownDataField(value, key);
      if (!field.safe || !field.present) return null;
      detached[key] = field.value;
    }
    return Object.freeze(detached);
  }

  function denseBoundedStringArray(value, maximumLength, maximumStringLength) {
    try {
      if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return null;
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
      if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0 || lengthDescriptor.value > maximumLength) return null;
      const length = lengthDescriptor.value;
      const keys = Reflect.ownKeys(value);
      if (keys.length !== length + 1 || !keys.includes("length")) return null;
      const detached = [];
      for (let index = 0; index < length; index += 1) {
        const key = String(index);
        if (!keys.includes(key)) return null;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return null;
        if (typeof descriptor.value !== "string" || !descriptor.value || descriptor.value.length > maximumStringLength) return null;
        detached.push(descriptor.value);
      }
      if (keys.some((key) => typeof key !== "string" || (key !== "length" && !/^(0|[1-9]\d*)$/.test(key)))) return null;
      return Object.freeze(detached);
    } catch {
      return null;
    }
  }

  function contentCosmeticDomainIsCanonical(value) {
    if (typeof value !== "string" || !value || value.length > MAX_CONTENT_DOMAIN_CHARS) return false;
    if (value !== value.trim() || value !== value.toLowerCase() || /[^\x21-\x7e]/.test(value)) return false;
    if (value.endsWith(".") || value.startsWith("*.") || value.startsWith("||") || /[/?#@]/.test(value)) return false;
    let hostname;
    try {
      hostname = new URL(`http://${value}`).hostname;
    } catch {
      return false;
    }
    if (hostname !== value) return false;
    return value === "localhost" || value.includes(".") || /^\d+\.\d+\.\d+\.\d+$/.test(value);
  }

  function canonicalCosmeticDomainArray(value) {
    const domains = denseBoundedStringArray(value, MAX_CONTENT_COSMETIC_DOMAINS, MAX_CONTENT_DOMAIN_CHARS);
    if (!domains || domains.length === 0 || domains.some((domain) => !contentCosmeticDomainIsCanonical(domain))) return false;
    if (new Set(domains).size !== domains.length) return false;
    const sorted = [...domains].sort();
    return sorted.every((domain, index) => domain === domains[index]);
  }

  function cosmeticMutationRuleSnapshot(rule) {
    if (!safeNonArrayObject(rule)) return null;
    const allowedKeys = ["selector", "domains", "excludedDomains"];
    let prototype;
    let keys;
    try {
      prototype = Object.getPrototypeOf(rule);
      keys = Reflect.ownKeys(rule);
    } catch {
      return null;
    }
    if (prototype !== Object.prototype && prototype !== null) return null;
    if (!keys.includes("selector") || keys.some((key) => typeof key !== "string" || !allowedKeys.includes(key))) return null;
    const selectorField = ownDataField(rule, "selector");
    if (!selectorField.safe || !selectorField.present || !contentCosmeticSelectorIsSafe(selectorField.value)) return null;
    for (const key of ["domains", "excludedDomains"]) {
      const field = ownDataField(rule, key);
      if (!field.safe) return null;
      if (field.present && !canonicalCosmeticDomainArray(field.value)) return null;
    }
    return true;
  }

  function contentCosmeticSelectorIsSafe(value) {
    if (typeof value !== "string") return false;
    const selector = value.trim();
    if (!selector || selector !== value || selector.length > MAX_CONTENT_COSMETIC_SELECTOR_CHARS) return false;
    if (/[^\x09\x20-\x7e]/.test(selector)) return false;
    if (/[{};]/.test(selector)) return false;
    if (/(?:^|[^a-z])(?:url|expression)\s*\(/i.test(selector) || /javascript:|-moz-binding/i.test(selector)) return false;
    if (/#\?#|#\$#|#%#|:has\(|:contains\(|:matches-css\(|:xpath\(|:-abp-/i.test(selector)) return false;
    if (selector.startsWith("@") || selector.includes("</")) return false;
    return true;
  }

  function canonicalCosmeticStylesheet(stylesheet, selectorCount) {
    if (selectorCount === 0) return stylesheet === "";
    if (typeof stylesheet !== "string" || !stylesheet.endsWith(COSMETIC_STYLESHEET_SUFFIX)) return false;
    const selectorText = stylesheet.slice(0, -COSMETIC_STYLESHEET_SUFFIX.length);
    if (!selectorText) return false;

    const selectors = [];
    let start = 0;
    while (selectors.length < selectorCount - 1) {
      const separator = selectorText.indexOf(",\n", start);
      if (separator < 0) return false;
      selectors.push(selectorText.slice(start, separator));
      start = separator + 2;
    }
    if (selectorText.indexOf(",\n", start) !== -1) return false;
    selectors.push(selectorText.slice(start));

    if (selectors.length !== selectorCount || new Set(selectors).size !== selectors.length) return false;
    return selectors.every(contentCosmeticSelectorIsSafe);
  }

  function snapshot(message, expectedType) {
    if (typeof expectedType !== "string") return null;
    const schemaField = ownDataField(SCHEMAS, expectedType);
    if (!schemaField.safe || !schemaField.present) return null;
    const schema = schemaField.value;
    const detached = exactOwnDataSnapshot(message, schema.keys);
    if (!detached || detached.type !== expectedType) return null;
    if (schema.targetUrl && (typeof detached.targetUrl !== "string" || !detached.targetUrl || detached.targetUrl.length > MAX_CONTEXT_TARGET_URL_CHARS)) return null;
    return detached;
  }

  function accepts(message, expectedType) {
    return snapshot(message, expectedType) !== null;
  }

  function contentFallbackMessage(fallback) {
    if (typeof fallback !== "string" || !fallback || fallback.length > MAX_CONTENT_RUNTIME_ERROR_CHARS) {
      throw new TypeError(`Content error fallback must be a non-empty string of at most ${MAX_CONTENT_RUNTIME_ERROR_CHARS} characters`);
    }
    return fallback;
  }

  function contentCaughtErrorMessage(error, fallback) {
    const safeFallback = contentFallbackMessage(fallback);
    if (!error || (typeof error !== "object" && typeof error !== "function")) return safeFallback;
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(error, "message");
    } catch {
      return safeFallback;
    }
    if (!descriptor || !("value" in descriptor)) return safeFallback;
    return typeof descriptor.value === "string"
      && descriptor.value.length > 0
      && descriptor.value.length <= MAX_CONTENT_RUNTIME_ERROR_CHARS
      ? descriptor.value
      : safeFallback;
  }

  function snapshotCosmeticPolicyResponse(response) {
    const okField = ownDataField(response, "ok");
    if (!okField.safe || !okField.present || typeof okField.value !== "boolean") return null;

    if (!okField.value) {
      const failure = exactOwnDataSnapshot(response, ["ok", "error"]);
      if (!failure || typeof failure.error !== "string" || !failure.error || failure.error.length > MAX_CONTENT_RUNTIME_ERROR_CHARS) return null;
      return Object.freeze(Object.assign(Object.create(null), { ok: false }));
    }

    const success = exactOwnDataSnapshot(response, ["ok", "policy"]);
    if (!success) return null;
    const policy = exactOwnDataSnapshot(success.policy, ["enabled", "selectorCount", "stylesheet"]);
    if (!policy || typeof policy.enabled !== "boolean") return null;
    if (!Number.isSafeInteger(policy.selectorCount) || policy.selectorCount < 0 || policy.selectorCount > MAX_CONTENT_COSMETIC_SELECTORS) return null;
    if (typeof policy.stylesheet !== "string") return null;
    if (policy.stylesheet.length > MAX_CONTENT_COSMETIC_STYLESHEET_BYTES) return null;
    let stylesheetBytes;
    try {
      stylesheetBytes = new TextEncoder().encode(policy.stylesheet).byteLength;
    } catch {
      return null;
    }
    if (stylesheetBytes > MAX_CONTENT_COSMETIC_STYLESHEET_BYTES) return null;
    if (!canonicalCosmeticStylesheet(policy.stylesheet, policy.selectorCount)) return null;
    if (!policy.enabled && (policy.selectorCount !== 0 || policy.stylesheet !== "")) return null;

    const detachedPolicy = Object.freeze(Object.assign(Object.create(null), {
      enabled: policy.enabled,
      selectorCount: policy.selectorCount,
      stylesheet: policy.stylesheet
    }));
    return Object.freeze(Object.assign(Object.create(null), { ok: true, policy: detachedPolicy }));
  }

  function snapshotCosmeticMutationResponse(response) {
    const okField = ownDataField(response, "ok");
    if (!okField.safe || !okField.present || typeof okField.value !== "boolean") return null;
    if (!okField.value) {
      const failure = exactOwnDataSnapshot(response, ["ok", "error"]);
      if (!failure || typeof failure.error !== "string" || !failure.error || failure.error.length > MAX_CONTENT_RUNTIME_ERROR_CHARS) return null;
      return Object.freeze(Object.assign(Object.create(null), { ok: false, error: failure.error }));
    }

    const success = exactOwnDataSnapshot(response, ["ok", "result"]);
    if (!success) return null;
    const result = exactOwnDataSnapshot(success.result, ["changed", "rule"]);
    if (!result || typeof result.changed !== "boolean" || !cosmeticMutationRuleSnapshot(result.rule)) return null;
    return Object.freeze(Object.assign(Object.create(null), { ok: true }));
  }

  globalThis.DropAdsContentMessageContract = Object.freeze({
    MAX_CONTEXT_TARGET_URL_CHARS,
    MAX_CONTENT_COSMETIC_SELECTORS,
    MAX_CONTENT_COSMETIC_STYLESHEET_BYTES,
    MAX_CONTENT_RUNTIME_ERROR_CHARS,
    accepts,
    snapshot,
    contentCaughtErrorMessage,
    snapshotCosmeticMutationResponse,
    snapshotCosmeticPolicyResponse
  });
})();
