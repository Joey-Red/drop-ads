(() => {
  const MAX_BUSY_ANCESTOR_STEPS = 16;
  const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;
  const DECLARATIVE_COMMAND_ATTRIBUTES = Object.freeze(["command", "commandfor", "invokeaction", "invoketarget"]);
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
  const nativeDocumentElementGetter = DocumentPrototype ? captureGetter(DocumentPrototype, "documentElement") : null;
  const nativeBodyGetter = DocumentPrototype ? captureGetter(DocumentPrototype, "body") : null;
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
  const HTMLButtonElementCtor = captureData(globalThis, "HTMLButtonElement");
  const HTMLButtonElementPrototype = typeof HTMLButtonElementCtor === "function" ? captureData(HTMLButtonElementCtor, "prototype") : null;
  const nativeButtonTypeGetter = HTMLButtonElementPrototype ? captureGetter(HTMLButtonElementPrototype, "type") : null;
  const HTMLInputElementCtor = captureData(globalThis, "HTMLInputElement");
  const HTMLInputElementPrototype = typeof HTMLInputElementCtor === "function" ? captureData(HTMLInputElementCtor, "prototype") : null;
  const nativeInputTypeGetter = HTMLInputElementPrototype ? captureGetter(HTMLInputElementPrototype, "type") : null;
  if (typeof nativeDocumentElementGetter !== "function" || typeof nativeBodyGetter !== "function"
    || typeof nativeGetAttribute !== "function" || typeof nativeHasAttribute !== "function"
    || typeof nativeTagNameGetter !== "function" || typeof nativeGetRootNode !== "function"
    || typeof nativeParentElementGetter !== "function" || typeof nativeShadowHostGetter !== "function"
    || typeof nativeButtonTypeGetter !== "function" || typeof nativeInputTypeGetter !== "function") return;

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

  function disclosureSemanticsSafe(element) {
    const present = elementHasAttribute(element, "aria-expanded");
    return present !== null && !present;
  }

  function nativeControlType(element, tag) {
    const getter = tag === "button" ? nativeButtonTypeGetter : tag === "input" ? nativeInputTypeGetter : null;
    if (!getter) return "";
    try {
      const value = Reflect.apply(getter, element, []);
      return typeof value === "string" ? value.trim().toLowerCase() : null;
    } catch { return null; }
  }

  function formResetSemanticsSafe(element) {
    const tag = elementTagName(element);
    if (tag === null) return false;
    if (tag !== "button" && tag !== "input") return true;
    const type = nativeControlType(element, tag);
    return type !== null && type !== "reset";
  }

  function nativeRoleSemanticsSafe(element) {
    const tag = elementTagName(element);
    if (tag === null) return false;
    if (tag !== "button" && tag !== "input") return true;
    const rawRole = elementAttribute(element, "role");
    if (rawRole === ATTRIBUTE_ERROR) return false;
    const role = (rawRole ?? "").trim().toLowerCase();
    return role === "" || role === "button";
  }

  function busySemanticsSafe(element) {
    let current = element;
    let steps = 0;
    while (current && steps <= MAX_BUSY_ANCESTOR_STEPS) {
      if (current === PARENT_ERROR) return false;
      const present = elementHasAttribute(current, "aria-busy");
      if (present === null) return false;
      if (present) {
        const raw = elementAttribute(current, "aria-busy");
        if (raw === ATTRIBUTE_ERROR) return false;
        if ((raw ?? "").trim().toLowerCase() !== "false") return false;
      }
      if (current === documentBody || current === documentElement) return true;
      current = composedParent(current);
      steps += 1;
    }
    return current === null;
  }

  function controlledRegionSemanticsSafe(element) {
    const present = elementHasAttribute(element, "aria-controls");
    return present !== null && !present;
  }

  function declarativeCommandSemanticsSafe(element) {
    for (const attribute of DECLARATIVE_COMMAND_ATTRIBUTES) {
      const present = elementHasAttribute(element, attribute);
      if (present === null || present) return false;
    }
    return true;
  }

  function textSnapshot(element) {
    if (!disclosureSemanticsSafe(element)
      || !formResetSemanticsSafe(element)
      || !nativeRoleSemanticsSafe(element)
      || !busySemanticsSafe(element)
      || !controlledRegionSemanticsSafe(element)
      || !declarativeCommandSemanticsSafe(element)) return "";
    try { return Reflect.apply(originalTextSnapshot, undefined, [element]); }
    catch { return ""; }
  }

  try {
    if (!Reflect.apply(replaceUtils, composition, [{ textSnapshot }])) return;
  } catch { return; }
})();
