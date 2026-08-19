(() => {
  const MAX_ACTIVATION_ANCESTOR_STEPS = 16;
  const MAX_EDITABLE_ANCESTOR_STEPS = 16;
  const MAX_CONTEXT_DESCENDANT_ELEMENTS = 128;
  const MAX_ARIA_LABELLEDBY_IDS = 4;
  const MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256;
  const MAX_REFERENCED_LABEL_ELEMENTS = 64;
  const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;
  const TOGGLE_ROLES = new Set(["switch", "checkbox", "radio", "menuitemcheckbox", "menuitemradio"]);
  const ATTRIBUTE_ERROR = Object.freeze({});
  const PARENT_ERROR = Object.freeze({});
  const EDITABLE_ERROR = Object.freeze({});

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
  if (typeof originalTextSnapshot !== "function") return;

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
  const nativeGetRootNode = NodePrototype ? captureData(NodePrototype, "getRootNode") : null;
  const nativeParentElementGetter = NodePrototype ? captureGetter(NodePrototype, "parentElement") : null;
  const ShadowRootCtor = captureData(globalThis, "ShadowRoot");
  const ShadowRootPrototype = typeof ShadowRootCtor === "function" ? captureData(ShadowRootCtor, "prototype") : null;
  const nativeShadowHostGetter = ShadowRootPrototype ? captureGetter(ShadowRootPrototype, "host") : null;
  const nativeShadowGetElementById = ShadowRootPrototype ? captureData(ShadowRootPrototype, "getElementById") : null;
  const NodeFilterObject = captureData(globalThis, "NodeFilter");
  const SHOW_ELEMENT = ownDataValue(NodeFilterObject, "SHOW_ELEMENT");
  if (typeof nativeCreateTreeWalker !== "function" || typeof nativeDocumentGetElementById !== "function"
    || typeof nativeDocumentElementGetter !== "function" || typeof nativeBodyGetter !== "function"
    || typeof nativeTreeWalkerNextNode !== "function" || typeof nativeGetAttribute !== "function"
    || typeof nativeHasAttribute !== "function" || typeof nativeTagNameGetter !== "function"
    || typeof nativeGetRootNode !== "function" || typeof nativeParentElementGetter !== "function"
    || typeof nativeShadowHostGetter !== "function" || typeof nativeShadowGetElementById !== "function"
    || !Number.isSafeInteger(SHOW_ELEMENT)) return;

  let documentElement;
  let documentBody;
  try {
    documentElement = Reflect.apply(nativeDocumentElementGetter, document, []);
    documentBody = Reflect.apply(nativeBodyGetter, document, []);
  } catch { return; }
  if (!documentElement) return;

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

  function activationAncestorUnsafe(element) {
    const tag = elementTagName(element);
    if (tag === null) return true;
    if (["a", "area", "button", "input", "select", "textarea", "option", "label", "summary"].includes(tag)) return true;
    const href = elementHasAttribute(element, "href");
    const formaction = elementHasAttribute(element, "formaction");
    const role = elementAttribute(element, "role");
    if (href === null || formaction === null || role === ATTRIBUTE_ERROR) return true;
    return href || formaction || role === "button" || role === "link";
  }

  function activationAncestrySafe(element) {
    let current = composedParent(element);
    let steps = 0;
    while (current && steps < MAX_ACTIVATION_ANCESTOR_STEPS) {
      if (current === PARENT_ERROR || activationAncestorUnsafe(current)) return false;
      if (current === documentBody || current === documentElement) return true;
      current = composedParent(current);
      steps += 1;
    }
    return current === null;
  }

  function explicitEditableState(element) {
    const present = elementHasAttribute(element, "contenteditable");
    if (present === null) return EDITABLE_ERROR;
    if (!present) return null;
    const raw = elementAttribute(element, "contenteditable");
    if (raw === ATTRIBUTE_ERROR) return EDITABLE_ERROR;
    const value = (raw ?? "").trim().toLowerCase();
    if (value === "false") return false;
    if (value === "" || value === "true" || value === "plaintext-only") return true;
    return null;
  }

  function editableContextSafe(element) {
    let current = element;
    let steps = 0;
    while (current && steps <= MAX_EDITABLE_ANCESTOR_STEPS) {
      if (current === PARENT_ERROR) return false;
      const state = explicitEditableState(current);
      if (state === EDITABLE_ERROR) return false;
      if (state === false) return true;
      if (state === true) return false;
      if (current === documentBody || current === documentElement) return true;
      current = composedParent(current);
      steps += 1;
    }
    return current === null;
  }

  function editableDescendantsSafe(element, maxElements = MAX_CONTEXT_DESCENDANT_ELEMENTS) {
    let walker;
    try { walker = Reflect.apply(nativeCreateTreeWalker, document, [element, SHOW_ELEMENT]); }
    catch { return false; }
    if (!walker) return false;
    let visited = 0;
    while (true) {
      let node;
      try { node = Reflect.apply(nativeTreeWalkerNextNode, walker, []); }
      catch { return false; }
      if (!node) return true;
      visited += 1;
      if (visited > maxElements) return false;
      const state = explicitEditableState(node);
      if (state === EDITABLE_ERROR || state === true) return false;
    }
  }

  function rootElementById(root, id) {
    try {
      const method = root === document ? nativeDocumentGetElementById : nativeShadowGetElementById;
      return Reflect.apply(method, root, [id]);
    } catch { return null; }
  }

  function editableLabelledByTreesSafe(element) {
    const rawIdsValue = elementAttribute(element, "aria-labelledby");
    if (rawIdsValue === ATTRIBUTE_ERROR) return false;
    const rawIds = rawIdsValue || "";
    if (!rawIds) return true;
    const root = nodeRoot(element);
    if (rawIds.length > MAX_ARIA_LABELLEDBY_ATTR_CHARS || !root) return false;
    const ids = rawIds.trim().split(/\s+/).filter(Boolean);
    if (!ids.length || ids.length > MAX_ARIA_LABELLEDBY_IDS || new Set(ids).size !== ids.length) return false;
    for (const id of ids) {
      const target = rootElementById(root, id);
      const targetRoot = target ? nodeRoot(target) : null;
      if (!target || target === element || targetRoot !== root) return false;
      const state = explicitEditableState(target);
      if (state === EDITABLE_ERROR || state === true || !editableDescendantsSafe(target, MAX_REFERENCED_LABEL_ELEMENTS)) return false;
    }
    return true;
  }

  function popupLaunchSemanticsSafe(element) {
    const present = elementHasAttribute(element, "aria-haspopup");
    if (present === null) return false;
    if (!present) return true;
    const raw = elementAttribute(element, "aria-haspopup");
    if (raw === ATTRIBUTE_ERROR) return false;
    return (raw ?? "").trim().toLowerCase() === "false";
  }

  function toggleSemanticsSafe(element) {
    const pressed = elementHasAttribute(element, "aria-pressed");
    const checked = elementHasAttribute(element, "aria-checked");
    if (pressed === null || checked === null || pressed || checked) return false;
    const rawRole = elementAttribute(element, "role");
    if (rawRole === ATTRIBUTE_ERROR) return false;
    return !TOGGLE_ROLES.has((rawRole ?? "").trim().toLowerCase());
  }

  function popoverTargetSemanticsSafe(element) {
    const target = elementHasAttribute(element, "popovertarget");
    const action = elementHasAttribute(element, "popovertargetaction");
    return target !== null && action !== null && !target && !action;
  }

  function textSnapshot(element) {
    if (!activationAncestrySafe(element)
      || !editableContextSafe(element)
      || !editableDescendantsSafe(element)
      || !editableLabelledByTreesSafe(element)
      || !popupLaunchSemanticsSafe(element)
      || !toggleSemanticsSafe(element)
      || !popoverTargetSemanticsSafe(element)) return "";
    try { return Reflect.apply(originalTextSnapshot, undefined, [element]); }
    catch { return ""; }
  }

  try {
    if (!Reflect.apply(replaceUtils, composition, [{ textSnapshot }])) return;
  } catch { return; }
})();
