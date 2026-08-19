(() => {
  const MAX_SELECTOR_LENGTH = 400;
  const MAX_DEPTH = 5;
  const MAX_SIBLING_SCAN = 10_000;
  const MAX_CLASS_TOKEN_SCAN = 64;
  const MAX_SELECTED_CLASS_TOKENS = 3;
  const MAX_UNIQUENESS_PROBES = 32;
  const SAFE_ATTRIBUTE_NAMES = ["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id", "role", "type"];

  function fixedCodeUnitCompare(left, right) {
    if (left === right) return 0;
    return left < right ? -1 : 1;
  }

  function cssEscape(value) {
    if (typeof value !== "string") throw new TypeError("CSS escape input must be a string");
    if (value.length > MAX_SELECTOR_LENGTH) throw new Error(`CSS escape input exceeds ${MAX_SELECTOR_LENGTH} characters`);
    const chars = [...value];
    let result = "";
    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      const code = char.codePointAt(0);
      const leadingDigit = index === 0 && /[0-9]/.test(char);
      const secondDigitAfterHyphen = index === 1 && chars[0] === "-" && /[0-9]/.test(char);
      const safeAscii = /[a-zA-Z0-9_-]/.test(char) && !leadingDigit && !secondDigitAfterHyphen;
      const escaped = safeAscii ? char : `\\${code.toString(16)} `;
      if (result.length + escaped.length > MAX_SELECTOR_LENGTH) throw new Error(`CSS escape output exceeds ${MAX_SELECTOR_LENGTH} characters`);
      result += escaped;
    }
    return result;
  }

  function stableToken(value) {
    if (typeof value !== "string" || value.length > MAX_SELECTOR_LENGTH) return null;
    if (value !== value.trim()) return null;
    if (!value || value.length > 80 || /\s/.test(value)) return null;
    if (/[\u0000-\u001f\u007f\u034f\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/.test(value)) return null;
    if (/[/?#@=&%]/.test(value)) return null;
    if (/^[a-f0-9]{16,}$/i.test(value) || /\d{7,}/.test(value)) return null;
    return value;
  }

  function captureDocumentQuery(documentRef) {
    let querySelectorAll;
    try { querySelectorAll = documentRef?.querySelectorAll; }
    catch { return null; }
    if (typeof querySelectorAll !== "function") return null;

    return (selector, expectedElement) => {
      if (!selector || selector.length > MAX_SELECTOR_LENGTH || !expectedElement) return false;
      try {
        const result = Reflect.apply(querySelectorAll, documentRef, [selector]);
        const length = result?.length;
        if (!Number.isSafeInteger(length) || length !== 1) return false;
        return result[0] === expectedElement;
      } catch {
        return false;
      }
    };
  }

  function unique(documentRef, selector, expectedElement) {
    const query = captureDocumentQuery(documentRef);
    return query ? query(selector, expectedElement) : false;
  }

  function stableAttributeSelectors(element) {
    let getAttribute;
    try { getAttribute = element?.getAttribute; }
    catch { return []; }
    if (typeof getAttribute !== "function") return [];

    const selectors = [];
    const rawSnapshot = [];
    for (const name of SAFE_ATTRIBUTE_NAMES) {
      let raw;
      try { raw = Reflect.apply(getAttribute, element, [name]); }
      catch { return []; }
      rawSnapshot.push(raw);
      const value = stableToken(raw);
      if (value) selectors.push(`[${name}="${cssEscape(value)}"]`);
    }

    try {
      if (element.getAttribute !== getAttribute) return [];
      for (let index = 0; index < SAFE_ATTRIBUTE_NAMES.length; index += 1) {
        const raw = Reflect.apply(getAttribute, element, [SAFE_ATTRIBUTE_NAMES[index]]);
        if (raw !== rawSnapshot[index]) return [];
      }
    } catch {
      return [];
    }
    return selectors;
  }

  function attributeSelector(element) {
    return stableAttributeSelectors(element)[0] ?? "";
  }

  function normalizedTagName(value) {
    if (typeof value !== "string" || !value || value.length > MAX_SELECTOR_LENGTH) return "";
    return value.toLowerCase();
  }

  function stableStringProperty(element, property) {
    try {
      const first = element?.[property];
      const second = element?.[property];
      if (typeof first !== "string" || first !== second) return null;
      return first;
    } catch {
      return null;
    }
  }

  function elementTag(element) {
    const localName = stableStringProperty(element, "localName");
    if (localName) return normalizedTagName(localName);
    const tagName = stableStringProperty(element, "tagName");
    return normalizedTagName(tagName);
  }

  function elementIdToken(element) {
    const id = stableStringProperty(element, "id");
    return stableToken(id);
  }

  function stableIdIsUnique(element, documentRef, probe = unique) {
    const id = elementIdToken(element);
    return Boolean(id) && probe(documentRef, `#${cssEscape(id)}`, element);
  }

  function extensionOwnedClassToken(token) {
    return typeof token === "string" && token.startsWith("drop-ads-");
  }

  function stableClassTokens(element) {
    let classList;
    let length;
    try {
      classList = element.classList;
      if (!classList || (typeof classList !== "object" && typeof classList !== "function")) return [];
      length = classList.length;
    } catch {
      return [];
    }
    if (!Number.isInteger(length) || length < 0 || length > MAX_CLASS_TOKEN_SCAN) return [];

    const tokens = [];
    const rawSnapshot = [];
    for (let index = 0; index < length; index += 1) {
      let raw;
      try { raw = classList[index]; }
      catch { return []; }
      rawSnapshot.push(raw);
      const token = stableToken(raw);
      if (!token || extensionOwnedClassToken(token)) continue;
      if (!tokens.includes(token)) tokens.push(token);
    }

    try {
      if (element.classList !== classList || classList.length !== length) return [];
      for (let index = 0; index < length; index += 1) {
        if (classList[index] !== rawSnapshot[index]) return [];
      }
    } catch {
      return [];
    }

    tokens.sort(fixedCodeUnitCompare);
    return tokens.slice(0, MAX_SELECTED_CLASS_TOKENS);
  }

  function stableClassSelectorCandidates(element, tag) {
    const classes = stableClassTokens(element);
    const candidates = [];
    for (let count = 1; count <= classes.length; count += 1) {
      const suffix = classes.slice(0, count).map((value) => `.${cssEscape(value)}`).join("");
      candidates.push(`${tag}${suffix}`);
    }
    return candidates;
  }

  function compactPart(element, includeId = true) {
    const tag = elementTag(element);
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) return "";
    if (includeId) {
      const id = elementIdToken(element);
      if (id) return `#${cssEscape(id)}`;
    }
    const attribute = attributeSelector(element);
    if (attribute) return `${tag}${attribute}`;
    const classes = stableClassTokens(element);
    if (classes.length) return `${tag}${classes.map((value) => `.${cssEscape(value)}`).join("")}`;
    return tag;
  }

  function directIdentityCandidates(element, includeId = true) {
    const tag = elementTag(element);
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) return [];
    const candidates = [];
    if (includeId) {
      const id = elementIdToken(element);
      if (id) candidates.push(`#${cssEscape(id)}`);
    }
    for (const attribute of stableAttributeSelectors(element)) candidates.push(`${tag}${attribute}`);
    candidates.push(...stableClassSelectorCandidates(element, tag));
    return candidates;
  }

  function selectorCarriesIdentity(part, element) {
    return Boolean(part) && part !== elementTag(element);
  }

  function isElementNode(element) {
    try { return Boolean(element) && element.nodeType === 1; }
    catch { return false; }
  }

  function selectorUniquelyIdentifies(selector, element, documentRef = document) {
    if (!isElementNode(element)) return false;
    try {
      if (element.isConnected !== true) return false;
    } catch {
      return false;
    }
    return unique(documentRef, selector, element);
  }

  function parentElementOf(element) {
    try {
      const parent = element?.parentElement ?? null;
      return isElementNode(parent) ? parent : null;
    } catch {
      return null;
    }
  }

  function nthPart(element, includeId = true) {
    const base = compactPart(element, includeId);
    if (!base || base.startsWith("#")) return base;
    const parent = parentElementOf(element);
    if (!parent) return base;

    let children;
    let length;
    try {
      children = parent.children;
      length = children?.length;
    } catch {
      throw new Error("Picker sibling list is unavailable");
    }
    if (!children || !Number.isSafeInteger(length) || length < 0) throw new Error("Picker sibling list is invalid");
    if (length > MAX_SIBLING_SCAN) throw new Error(`Picker target has more than ${MAX_SIBLING_SCAN} siblings to inspect safely`);

    const targetTag = elementTag(element);
    const siblingSnapshot = [];
    let sameTagCount = 0;
    let position = 0;
    for (let index = 0; index < length; index += 1) {
      let sibling;
      try { sibling = children[index]; }
      catch { throw new Error("Picker sibling list is unavailable"); }
      siblingSnapshot.push(sibling);
      if (!isElementNode(sibling) || elementTag(sibling) !== targetTag) continue;
      sameTagCount += 1;
      if (sibling === element) position = sameTagCount;
    }

    try {
      if (parent.children !== children || children.length !== length) throw new Error("Picker sibling list changed during selection");
      for (let index = 0; index < length; index += 1) {
        if (children[index] !== siblingSnapshot[index]) throw new Error("Picker sibling list changed during selection");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Picker sibling list changed during selection") throw error;
      throw new Error("Picker sibling list is unavailable");
    }

    if (!position) throw new Error("Picker target is no longer attached to its parent");
    if (sameTagCount <= 1) return base;
    return `${base}:nth-of-type(${position})`;
  }

  function generateStableSelector(element, documentRef = document) {
    if (!isElementNode(element)) throw new Error("Picker target must be an element");
    const documentQuery = captureDocumentQuery(documentRef);
    if (!documentQuery) throw new Error("Picker document query is unavailable");
    let uniquenessProbeCount = 0;
    const probe = (_documentValue, selector, expectedElement) => {
      uniquenessProbeCount += 1;
      if (uniquenessProbeCount > MAX_UNIQUENESS_PROBES) throw new Error("Picker selector uniqueness probe limit exceeded");
      return documentQuery(selector, expectedElement);
    };

    const directCandidates = directIdentityCandidates(element);
    for (const candidate of directCandidates) if (probe(documentRef, candidate, element)) return candidate;

    const duplicateId = directCandidates[0]?.startsWith("#") === true;
    const parts = [];
    let current = element;
    for (let depth = 0; current && depth < MAX_DEPTH; depth += 1) {
      const includeId = depth === 0 ? !duplicateId : stableIdIsUnique(current, documentRef, probe);
      const part = nthPart(current, includeId);
      if (!part) break;
      parts.unshift(part);
      const selector = parts.join(" > ");
      if (selector.length > MAX_SELECTOR_LENGTH) break;
      if ((parts.length > 1 || selectorCarriesIdentity(part, current)) && probe(documentRef, selector, element)) return selector;
      current = parentElementOf(current);
    }
    throw new Error("Could not generate a stable unique selector for this element");
  }

  globalThis.DropAdsSelectorUtils = Object.freeze({
    generateStableSelector,
    selectorUniquelyIdentifies,
    cssEscape,
    stableToken,
    elementTag,
    MAX_SELECTOR_LENGTH,
    MAX_SIBLING_SCAN,
    MAX_UNIQUENESS_PROBES
  });
})();
