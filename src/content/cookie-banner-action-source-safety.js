(() => {
  const MAX_ACTION_RAW_CHARS = 512;
  const MAX_ACTION_TEXT_CHARS = 160;
  const MAX_ACTION_TEXT_NODES = 32;
  const MAX_ACTION_ELEMENT_NODES = 128;
  const MAX_HIDDEN_NAME_TEXT_NODES = 8;
  const MAX_HIDDEN_NAME_RAW_CHARS = 160;
  const MAX_ARIA_LABELLEDBY_IDS = 4;
  const MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256;
  const MAX_ARIA_REFERENCE_TEXT_NODES = 16;
  const MAX_ARIA_REFERENCE_RAW_CHARS = 256;
  const MAX_ARIA_REFERENCE_ELEMENT_NODES = 64;
  const MAX_NAVIGATION_ANCESTOR_STEPS = 16;
  const MAX_UNICODE_FOLDED_CHARS = 1_024;
  const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;
  const FORBIDDEN_ACTION_FORMAT_PATTERN = /[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/u;
  const UNICODE_LETTER_OR_NUMBER_PATTERN = /[\p{L}\p{N}]/u;
  const ATTRIBUTE_ERROR = Object.freeze({});
  const PARENT_ERROR = Object.freeze({});

  function ownDataValue(object, key) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
    catch { return null; }
    return descriptor && "value" in descriptor && !descriptor.get && !descriptor.set ? descriptor.value : null;
  }

  const composition = ownDataValue(globalThis, "DropAdsCookieBannerUtilsComposition");
  const snapshotUtils = ownDataValue(composition, "snapshotUtils");
  const replaceUtils = ownDataValue(composition, "replaceUtils");
  if (!composition || !Object.isFrozen(composition) || typeof snapshotUtils !== "function" || typeof replaceUtils !== "function") return;

  let utils;
  try { utils = Reflect.apply(snapshotUtils, composition, []); }
  catch { return; }
  const originalTextSnapshot = ownDataValue(utils, "textSnapshot");
  const normalizedActionText = ownDataValue(utils, "normalizedActionText");
  const isDropAdsOwned = ownDataValue(utils, "isDropAdsOwned");
  if (![originalTextSnapshot, normalizedActionText, isDropAdsOwned].every((value) => typeof value === "function")) return;

  function captureDescriptor(receiver, key) {
    if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) return null;
    let current = receiver;
    for (let depth = 0; current && depth <= MAX_PLATFORM_PROTOTYPE_DEPTH; depth += 1) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
      catch { return null; }
      if (descriptor) return descriptor;
      try { current = Object.getPrototypeOf(current); }
      catch { return null; }
    }
    return null;
  }

  function captureData(receiver, key) {
    const descriptor = captureDescriptor(receiver, key);
    return descriptor && "value" in descriptor ? descriptor.value : null;
  }

  function captureGetter(receiver, key) {
    const descriptor = captureDescriptor(receiver, key);
    return descriptor && typeof descriptor.get === "function" ? descriptor.get : null;
  }

  const DocumentCtor = captureData(globalThis, "Document");
  const DocumentPrototype = typeof DocumentCtor === "function" ? captureData(DocumentCtor, "prototype") : null;
  const nativeCreateTreeWalker = DocumentPrototype ? captureData(DocumentPrototype, "createTreeWalker") : null;
  const nativeDocumentGetElementById = DocumentPrototype ? captureData(DocumentPrototype, "getElementById") : null;
  const nativeDocumentElementGetter = DocumentPrototype ? captureGetter(DocumentPrototype, "documentElement") : null;
  const nativeBodyGetter = DocumentPrototype ? captureGetter(DocumentPrototype, "body") : null;
  const TreeWalkerCtor = captureData(globalThis, "TreeWalker");
  const TreeWalkerPrototype = typeof TreeWalkerCtor === "function" ? captureData(TreeWalkerCtor, "prototype") : null;
  const nativeTreeWalkerNextNode = TreeWalkerPrototype ? captureData(TreeWalkerPrototype, "nextNode") : null;
  const ElementCtor = captureData(globalThis, "Element");
  const ElementPrototype = typeof ElementCtor === "function" ? captureData(ElementCtor, "prototype") : null;
  const nativeGetAttribute = ElementPrototype ? captureData(ElementPrototype, "getAttribute") : null;
  const nativeHasAttribute = ElementPrototype ? captureData(ElementPrototype, "hasAttribute") : null;
  const nativeTagNameGetter = ElementPrototype ? captureGetter(ElementPrototype, "tagName") : null;
  const NodeCtor = captureData(globalThis, "Node");
  const NodePrototype = typeof NodeCtor === "function" ? captureData(NodeCtor, "prototype") : null;
  const nativeNodeValueGetter = NodePrototype ? captureGetter(NodePrototype, "nodeValue") : null;
  const nativeGetRootNode = NodePrototype ? captureData(NodePrototype, "getRootNode") : null;
  const nativeParentElementGetter = NodePrototype ? captureGetter(NodePrototype, "parentElement") : null;
  const ShadowRootCtor = captureData(globalThis, "ShadowRoot");
  const ShadowRootPrototype = typeof ShadowRootCtor === "function" ? captureData(ShadowRootCtor, "prototype") : null;
  const nativeShadowHostGetter = ShadowRootPrototype ? captureGetter(ShadowRootPrototype, "host") : null;
  const nativeShadowGetElementById = ShadowRootPrototype ? captureData(ShadowRootPrototype, "getElementById") : null;
  const HTMLInputElementCtor = captureData(globalThis, "HTMLInputElement");
  const HTMLInputElementPrototype = typeof HTMLInputElementCtor === "function" ? captureData(HTMLInputElementCtor, "prototype") : null;
  const nativeInputValueGetter = HTMLInputElementPrototype ? captureGetter(HTMLInputElementPrototype, "value") : null;
  const NodeFilterObject = captureData(globalThis, "NodeFilter");
  const SHOW_TEXT = ownDataValue(NodeFilterObject, "SHOW_TEXT");
  const SHOW_ELEMENT = ownDataValue(NodeFilterObject, "SHOW_ELEMENT");
  if (typeof nativeCreateTreeWalker !== "function" || typeof nativeDocumentGetElementById !== "function"
    || typeof nativeDocumentElementGetter !== "function" || typeof nativeBodyGetter !== "function"
    || typeof nativeTreeWalkerNextNode !== "function" || typeof nativeGetAttribute !== "function"
    || typeof nativeHasAttribute !== "function" || typeof nativeTagNameGetter !== "function"
    || typeof nativeNodeValueGetter !== "function" || typeof nativeGetRootNode !== "function"
    || typeof nativeParentElementGetter !== "function" || typeof nativeShadowHostGetter !== "function"
    || typeof nativeShadowGetElementById !== "function" || typeof nativeInputValueGetter !== "function"
    || !Number.isSafeInteger(SHOW_TEXT) || !Number.isSafeInteger(SHOW_ELEMENT)) return;

  let documentElement;
  let documentBody;
  try {
    documentElement = Reflect.apply(nativeDocumentElementGetter, document, []);
    documentBody = Reflect.apply(nativeBodyGetter, document, []);
  } catch { return; }
  if (!documentElement) return;

  function normalizedLength(value) {
    if (typeof value !== "string" || !value) return 0;
    return value.replace(/\s+/g, " ").trim().length;
  }

  function sourceHasForbiddenFormat(value) {
    return typeof value === "string" && FORBIDDEN_ACTION_FORMAT_PATTERN.test(value);
  }

  function sourceHasUnsupportedSemanticCodePoint(value) {
    if (typeof value !== "string" || !value) return false;
    let folded;
    try { folded = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); } catch { return true; }
    if (folded.length > MAX_UNICODE_FOLDED_CHARS) return true;
    for (const char of folded) {
      if ((char.codePointAt(0) ?? 0) <= 0x7f) continue;
      if (UNICODE_LETTER_OR_NUMBER_PATTERN.test(char)) return true;
    }
    return false;
  }

  function sourceUnicodeSafe(value) {
    return !sourceHasForbiddenFormat(value) && !sourceHasUnsupportedSemanticCodePoint(value);
  }

  function elementAttribute(element, name) {
    try {
      const value = Reflect.apply(nativeGetAttribute, element, [name]);
      return value === null || typeof value === "string" ? value : ATTRIBUTE_ERROR;
    } catch { return ATTRIBUTE_ERROR; }
  }

  function elementHasAttribute(element, name) {
    try { return Reflect.apply(nativeHasAttribute, element, [name]) === true; }
    catch { return null; }
  }

  function elementTagName(element) {
    try {
      const value = Reflect.apply(nativeTagNameGetter, element, []);
      return typeof value === "string" ? value.toLowerCase() : null;
    } catch { return null; }
  }

  function nodeRoot(node) {
    try { return Reflect.apply(nativeGetRootNode, node, []); }
    catch { return null; }
  }

  function createWalker(root, whatToShow) {
    try { return Reflect.apply(nativeCreateTreeWalker, document, [root, whatToShow]); }
    catch { return null; }
  }

  function walkerNext(walker) {
    try { return Reflect.apply(nativeTreeWalkerNextNode, walker, []); }
    catch { return PARENT_ERROR; }
  }

  function directActionChannels(element) {
    const ariaLabel = elementAttribute(element, "aria-label");
    if (ariaLabel === ATTRIBUTE_ERROR) return null;
    const tag = elementTagName(element);
    if (tag === null) return null;
    let value = "";
    if (tag === "input") {
      try {
        const inputValue = Reflect.apply(nativeInputValueGetter, element, []);
        if (typeof inputValue !== "string") return null;
        value = inputValue;
      } catch { return null; }
    }
    return Object.freeze({ value, ariaLabel: ariaLabel || "" });
  }

  function directActionSource(element) {
    const channels = directActionChannels(element);
    if (!channels) return null;
    return channels.value || channels.ariaLabel;
  }

  function directSourcesWithinBounds(element) {
    const channels = directActionChannels(element);
    if (!channels) return false;
    for (const source of [channels.value, channels.ariaLabel]) {
      if (source.length > MAX_ACTION_RAW_CHARS) return false;
      if (normalizedLength(source) > MAX_ACTION_TEXT_CHARS || !sourceUnicodeSafe(source)) return false;
    }
    return true;
  }

  function directChannelsAgree(element) {
    const channels = directActionChannels(element);
    if (!channels) return false;
    if (!channels.value || !channels.ariaLabel) return true;
    try {
      const valueName = Reflect.apply(normalizedActionText, undefined, [channels.value]);
      const ariaName = Reflect.apply(normalizedActionText, undefined, [channels.ariaLabel]);
      return Boolean(valueName) && valueName === ariaName;
    } catch { return false; }
  }

  function completeDescendantText(element, maxNodes, maxRawChars) {
    const walker = createWalker(element, SHOW_TEXT);
    if (!walker) return null;
    let raw = "";
    let visited = 0;
    while (true) {
      const node = walkerNext(walker);
      if (node === PARENT_ERROR) return null;
      if (!node) break;
      visited += 1;
      if (visited > maxNodes) return null;
      let value;
      try { value = Reflect.apply(nativeNodeValueGetter, node, []); }
      catch { return null; }
      if (value === null) continue;
      if (typeof value !== "string") return null;
      if (!value) continue;
      if (raw.length + value.length + 1 > maxRawChars) return null;
      raw += `${value} `;
    }
    return raw;
  }

  function visibleSourceHasSafeFormat(element) {
    const raw = completeDescendantText(element, MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS);
    return raw !== null && sourceUnicodeSafe(raw);
  }

  function actionTreeExcludesDropAdsOwned(element) {
    const walker = createWalker(element, SHOW_ELEMENT);
    if (!walker) return false;
    let visited = 0;
    while (true) {
      const node = walkerNext(walker);
      if (node === PARENT_ERROR) return false;
      if (!node) return true;
      visited += 1;
      let owned;
      try { owned = Reflect.apply(isDropAdsOwned, undefined, [node]); }
      catch { return false; }
      if (visited > MAX_ACTION_ELEMENT_NODES || owned) return false;
    }
  }

  function interactiveDescendantUnsafe(element) {
    const tag = elementTagName(element);
    if (tag === null) return true;
    if (["a", "area", "button", "input", "select", "textarea", "option", "summary"].includes(tag)) return true;
    const role = elementAttribute(element, "role");
    return role === ATTRIBUTE_ERROR || role === "button" || role === "link";
  }

  function actionTreeExcludesInteractiveDescendants(element) {
    const walker = createWalker(element, SHOW_ELEMENT);
    if (!walker) return false;
    let visited = 0;
    while (true) {
      const node = walkerNext(walker);
      if (node === PARENT_ERROR) return false;
      if (!node) return true;
      visited += 1;
      if (visited > MAX_ACTION_ELEMENT_NODES || interactiveDescendantUnsafe(node)) return false;
    }
  }

  function hiddenNamingState(element) {
    const hidden = elementHasAttribute(element, "hidden");
    const inert = elementHasAttribute(element, "inert");
    const ariaHidden = elementAttribute(element, "aria-hidden");
    if (hidden === null || inert === null || ariaHidden === ATTRIBUTE_ERROR) return null;
    return hidden || inert || ariaHidden === "true";
  }

  function actionTreeExcludesHiddenText(element) {
    const walker = createWalker(element, SHOW_ELEMENT);
    if (!walker) return false;
    let visited = 0;
    while (true) {
      const node = walkerNext(walker);
      if (node === PARENT_ERROR) return false;
      if (!node) return true;
      visited += 1;
      if (visited > MAX_ACTION_ELEMENT_NODES) return false;
      const hidden = hiddenNamingState(node);
      if (hidden === null) return false;
      if (!hidden) continue;
      const hiddenText = completeDescendantText(node, MAX_HIDDEN_NAME_TEXT_NODES, MAX_HIDDEN_NAME_RAW_CHARS);
      if (hiddenText === null || normalizedLength(hiddenText) > 0) return false;
    }
  }

  function descendantSourceWithinBounds(element) {
    const direct = directActionSource(element);
    if (direct === null) return false;
    if (direct) return true;
    const raw = completeDescendantText(element, MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS);
    return raw !== null && sourceUnicodeSafe(raw) && normalizedLength(raw) <= MAX_ACTION_TEXT_CHARS;
  }

  function namingElementUnsafe(element) {
    if (!element) return true;
    let owned;
    try { owned = Reflect.apply(isDropAdsOwned, undefined, [element]); }
    catch { return true; }
    return owned || interactiveDescendantUnsafe(element);
  }

  function referencedLabelTreeSafe(target) {
    if (namingElementUnsafe(target)) return false;
    const walker = createWalker(target, SHOW_ELEMENT);
    if (!walker) return false;
    let visited = 0;
    while (true) {
      const node = walkerNext(walker);
      if (node === PARENT_ERROR) return false;
      if (!node) return true;
      visited += 1;
      if (visited > MAX_ARIA_REFERENCE_ELEMENT_NODES || namingElementUnsafe(node)) return false;
    }
  }

  function rootElementById(root, id) {
    try {
      const method = root === document ? nativeDocumentGetElementById : nativeShadowGetElementById;
      return Reflect.apply(method, root, [id]);
    } catch { return null; }
  }

  function completeLabelledBySource(element) {
    const rawIdsValue = elementAttribute(element, "aria-labelledby");
    if (rawIdsValue === ATTRIBUTE_ERROR) return null;
    const rawIds = rawIdsValue || "";
    const root = nodeRoot(element);
    if (!root) return null;
    if (!rawIds) return "";
    if (rawIds.length > MAX_ARIA_LABELLEDBY_ATTR_CHARS || sourceHasForbiddenFormat(rawIds)) return null;
    const ids = rawIds.trim().split(/\s+/).filter(Boolean);
    if (!ids.length || ids.length > MAX_ARIA_LABELLEDBY_IDS || new Set(ids).size !== ids.length) return null;
    let joined = "";
    for (const id of ids) {
      if (id.length > 128) return null;
      const target = rootElementById(root, id);
      const targetRoot = target ? nodeRoot(target) : null;
      if (!target || target === element || targetRoot !== root || !referencedLabelTreeSafe(target)) return null;
      const raw = completeDescendantText(target, MAX_ARIA_REFERENCE_TEXT_NODES, MAX_ARIA_REFERENCE_RAW_CHARS);
      if (raw === null || !sourceUnicodeSafe(raw) || normalizedLength(raw) === 0 || normalizedLength(raw) > MAX_ACTION_TEXT_CHARS) return null;
      if (joined.length + raw.length > MAX_ACTION_RAW_CHARS) return null;
      joined += raw;
    }
    return sourceUnicodeSafe(joined) && normalizedLength(joined) <= MAX_ACTION_TEXT_CHARS ? joined : null;
  }

  function labelledBySourceWithinBounds(element) {
    return completeLabelledBySource(element) !== null;
  }

  function directAndVisibleNamesAgree(element) {
    const direct = directActionSource(element);
    if (direct === null) return false;
    if (!direct) return true;
    const visible = completeDescendantText(element, MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS);
    if (visible === null || !sourceUnicodeSafe(visible)) return false;
    if (!visible.replace(/\s+/g, " ").trim()) return true;
    try {
      const directNormalized = Reflect.apply(normalizedActionText, undefined, [direct]);
      const visibleNormalized = Reflect.apply(normalizedActionText, undefined, [visible]);
      return Boolean(directNormalized) && directNormalized === visibleNormalized;
    } catch { return false; }
  }

  function labelledByAndOtherNamesAgree(element) {
    const labelledBy = completeLabelledBySource(element);
    if (labelledBy === null) return false;
    if (!labelledBy) return true;
    const direct = directActionSource(element);
    if (direct === null) return false;
    let other = direct;
    if (!other) {
      const visible = completeDescendantText(element, MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS);
      if (visible === null || !sourceUnicodeSafe(visible)) return false;
      other = visible.replace(/\s+/g, " ").trim() ? visible : "";
    }
    if (!other) return true;
    try {
      const labelledNormalized = Reflect.apply(normalizedActionText, undefined, [labelledBy]);
      const otherNormalized = Reflect.apply(normalizedActionText, undefined, [other]);
      return Boolean(labelledNormalized) && labelledNormalized === otherNormalized;
    } catch { return false; }
  }

  function composedParent(element) {
    try {
      const parent = Reflect.apply(nativeParentElementGetter, element, []);
      if (parent) return parent;
      const root = Reflect.apply(nativeGetRootNode, element, []);
      if (!root || root === document) return null;
      const host = Reflect.apply(nativeShadowHostGetter, root, []);
      return host || null;
    } catch { return PARENT_ERROR; }
  }

  function navigationContainerUnsafe(element) {
    const tag = elementTagName(element);
    if (tag === null || tag === "a" || tag === "area") return true;
    const href = elementHasAttribute(element, "href");
    const formaction = elementHasAttribute(element, "formaction");
    const role = elementAttribute(element, "role");
    if (href === null || formaction === null || role === ATTRIBUTE_ERROR) return true;
    return href || formaction || role === "link";
  }

  function navigationAncestrySafe(element) {
    let current = composedParent(element);
    let steps = 0;
    while (current && steps < MAX_NAVIGATION_ANCESTOR_STEPS) {
      if (current === PARENT_ERROR || navigationContainerUnsafe(current)) return false;
      if (current === documentBody || current === documentElement) return true;
      current = composedParent(current);
      steps += 1;
    }
    return current === null;
  }

  function textSnapshot(element) {
    if (!directSourcesWithinBounds(element)
      || !directChannelsAgree(element)
      || !visibleSourceHasSafeFormat(element)
      || !actionTreeExcludesDropAdsOwned(element)
      || !actionTreeExcludesInteractiveDescendants(element)
      || !actionTreeExcludesHiddenText(element)
      || !descendantSourceWithinBounds(element)
      || !labelledBySourceWithinBounds(element)
      || !directAndVisibleNamesAgree(element)
      || !labelledByAndOtherNamesAgree(element)
      || !navigationAncestrySafe(element)) return "";
    try { return Reflect.apply(originalTextSnapshot, undefined, [element]); }
    catch { return ""; }
  }

  try {
    if (!Reflect.apply(replaceUtils, composition, [{ textSnapshot }])) return;
  } catch { return; }
})();
