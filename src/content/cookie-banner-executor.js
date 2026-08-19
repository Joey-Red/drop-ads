(() => {
  const EXECUTOR_GLOBAL = "DropAdsCookieBannerExecutor";
  const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;
  const MAX_INTERACTION_ANCESTOR_STEPS = 24;
  const MAX_HIT_TEST_SHADOW_DEPTH = 4;

  function ownDataValue(object, key) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
    catch { return null; }
    return descriptor && "value" in descriptor && !descriptor.get && !descriptor.set ? descriptor.value : null;
  }

  const composition = ownDataValue(globalThis, "DropAdsCookieBannerUtilsComposition");
  const snapshotUtils = ownDataValue(composition, "snapshotUtils");
  if (!composition || !Object.isFrozen(composition) || typeof snapshotUtils !== "function") return;
  let utils;
  try { utils = Reflect.apply(snapshotUtils, composition, []); }
  catch { return; }
  if (!utils) return;

  const snapshotCandidate = ownDataValue(utils, "snapshotCandidate");
  const findConsentContainer = ownDataValue(utils, "findConsentContainer");
  const isButtonLike = ownDataValue(utils, "isButtonLike");
  const isDropAdsOwned = ownDataValue(utils, "isDropAdsOwned");
  const textSnapshot = ownDataValue(utils, "textSnapshot");
  const rejectionScore = ownDataValue(utils, "rejectionScore");
  if (![snapshotCandidate, findConsentContainer, isButtonLike, isDropAdsOwned, textSnapshot, rejectionScore].every((value) => typeof value === "function")) return;

  const consentSafety = ownDataValue(globalThis, "DropAdsCookieBannerConsentSafety");
  let consentSafetyPrototype;
  let consentSafetyKeys;
  try {
    consentSafetyPrototype = Object.getPrototypeOf(consentSafety);
    consentSafetyKeys = Reflect.ownKeys(consentSafety);
  } catch { return; }
  if (!consentSafety || consentSafetyPrototype !== Object.prototype || !Object.isFrozen(consentSafety)
    || consentSafetyKeys.length !== 1 || consentSafetyKeys[0] !== "isStrongConsentContainer") return;
  const isStrongConsentContainer = ownDataValue(consentSafety, "isStrongConsentContainer");
  if (typeof isStrongConsentContainer !== "function") return;

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

  const HTMLElementCtor = captureData(globalThis, "HTMLElement");
  const HTMLElementPrototype = typeof HTMLElementCtor === "function" ? captureData(HTMLElementCtor, "prototype") : null;
  const nativeClick = HTMLElementPrototype ? captureData(HTMLElementPrototype, "click") : null;
  const nativeHiddenGetter = HTMLElementPrototype ? captureGetter(HTMLElementPrototype, "hidden") : null;
  const ElementCtor = captureData(globalThis, "Element");
  const ElementPrototype = typeof ElementCtor === "function" ? captureData(ElementCtor, "prototype") : null;
  const nativeGetBoundingClientRect = ElementPrototype ? captureData(ElementPrototype, "getBoundingClientRect") : null;
  const nativeShadowRootGetter = ElementPrototype ? captureGetter(ElementPrototype, "shadowRoot") : null;
  const nativeHasAttribute = ElementPrototype ? captureData(ElementPrototype, "hasAttribute") : null;
  const nativeGetAttribute = ElementPrototype ? captureData(ElementPrototype, "getAttribute") : null;
  const nativeTagNameGetter = ElementPrototype ? captureGetter(ElementPrototype, "tagName") : null;
  const NodeCtor = captureData(globalThis, "Node");
  const NodePrototype = typeof NodeCtor === "function" ? captureData(NodeCtor, "prototype") : null;
  const nativeContains = NodePrototype ? captureData(NodePrototype, "contains") : null;
  const nativeGetRootNode = NodePrototype ? captureData(NodePrototype, "getRootNode") : null;
  const nativeParentElementGetter = NodePrototype ? captureGetter(NodePrototype, "parentElement") : null;
  const nativeIsConnectedGetter = NodePrototype ? captureGetter(NodePrototype, "isConnected") : null;
  const ShadowRootCtor = captureData(globalThis, "ShadowRoot");
  const ShadowRootPrototype = typeof ShadowRootCtor === "function" ? captureData(ShadowRootCtor, "prototype") : null;
  const nativeShadowHostGetter = ShadowRootPrototype ? captureGetter(ShadowRootPrototype, "host") : null;
  const HTMLFieldSetElementCtor = captureData(globalThis, "HTMLFieldSetElement");
  const HTMLFieldSetElementPrototype = typeof HTMLFieldSetElementCtor === "function" ? captureData(HTMLFieldSetElementCtor, "prototype") : null;
  const nativeFieldSetDisabledGetter = HTMLFieldSetElementPrototype ? captureGetter(HTMLFieldSetElementPrototype, "disabled") : null;
  const CSSStyleDeclarationCtor = captureData(globalThis, "CSSStyleDeclaration");
  const CSSStyleDeclarationPrototype = typeof CSSStyleDeclarationCtor === "function" ? captureData(CSSStyleDeclarationCtor, "prototype") : null;
  const nativeStyleGetPropertyValue = CSSStyleDeclarationPrototype ? captureData(CSSStyleDeclarationPrototype, "getPropertyValue") : null;
  const DOMRectReadOnlyCtor = captureData(globalThis, "DOMRectReadOnly");
  const DOMRectReadOnlyPrototype = typeof DOMRectReadOnlyCtor === "function" ? captureData(DOMRectReadOnlyCtor, "prototype") : null;
  const nativeRectLeftGetter = DOMRectReadOnlyPrototype ? captureGetter(DOMRectReadOnlyPrototype, "left") : null;
  const nativeRectRightGetter = DOMRectReadOnlyPrototype ? captureGetter(DOMRectReadOnlyPrototype, "right") : null;
  const nativeRectTopGetter = DOMRectReadOnlyPrototype ? captureGetter(DOMRectReadOnlyPrototype, "top") : null;
  const nativeRectBottomGetter = DOMRectReadOnlyPrototype ? captureGetter(DOMRectReadOnlyPrototype, "bottom") : null;
  const nativeRectWidthGetter = DOMRectReadOnlyPrototype ? captureGetter(DOMRectReadOnlyPrototype, "width") : null;
  const nativeRectHeightGetter = DOMRectReadOnlyPrototype ? captureGetter(DOMRectReadOnlyPrototype, "height") : null;
  const nativeInnerWidthGetter = captureGetter(globalThis, "innerWidth");
  const nativeInnerHeightGetter = captureGetter(globalThis, "innerHeight");
  const nativeGetComputedStyle = captureData(globalThis, "getComputedStyle");
  const nativeDocumentElementFromPoint = captureData(document, "elementFromPoint");
  if (typeof nativeClick !== "function" || typeof nativeHiddenGetter !== "function"
    || typeof nativeGetBoundingClientRect !== "function" || typeof nativeGetComputedStyle !== "function"
    || typeof nativeShadowRootGetter !== "function" || typeof nativeHasAttribute !== "function"
    || typeof nativeGetAttribute !== "function" || typeof nativeTagNameGetter !== "function"
    || typeof nativeContains !== "function" || typeof nativeGetRootNode !== "function"
    || typeof nativeParentElementGetter !== "function" || typeof nativeIsConnectedGetter !== "function"
    || typeof nativeShadowHostGetter !== "function" || typeof nativeFieldSetDisabledGetter !== "function"
    || typeof nativeStyleGetPropertyValue !== "function"
    || ![nativeRectLeftGetter, nativeRectRightGetter, nativeRectTopGetter, nativeRectBottomGetter, nativeRectWidthGetter, nativeRectHeightGetter].every((value) => typeof value === "function")
    || typeof nativeInnerWidthGetter !== "function" || typeof nativeInnerHeightGetter !== "function"
    || typeof nativeDocumentElementFromPoint !== "function") return;

  function computedStyle(element) {
    try { return Reflect.apply(nativeGetComputedStyle, globalThis, [element]); }
    catch { return null; }
  }

  function styleValue(style, property) {
    try {
      const value = Reflect.apply(nativeStyleGetPropertyValue, style, [property]);
      return typeof value === "string" ? value.trim().toLowerCase() : null;
    } catch { return null; }
  }

  function boundingRect(element) {
    try { return Reflect.apply(nativeGetBoundingClientRect, element, []); }
    catch { return null; }
  }

  function rectNumber(rect, getter) {
    try {
      const value = Number(Reflect.apply(getter, rect, []));
      return Number.isFinite(value) ? value : null;
    } catch { return null; }
  }

  function viewportNumber(getter) {
    try {
      const value = Number(Reflect.apply(getter, globalThis, []));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch { return null; }
  }

  function openShadowRoot(element) {
    try { return Reflect.apply(nativeShadowRootGetter, element, []) ?? null; }
    catch { return null; }
  }

  function nodeContains(container, node) {
    try { return Reflect.apply(nativeContains, container, [node]) === true; }
    catch { return false; }
  }

  function nodeConnected(node) {
    try { return Reflect.apply(nativeIsConnectedGetter, node, []) === true; }
    catch { return false; }
  }

  function elementHasAttribute(element, name) {
    try { return Reflect.apply(nativeHasAttribute, element, [name]) === true; }
    catch { return true; }
  }

  function elementAttribute(element, name) {
    try {
      const value = Reflect.apply(nativeGetAttribute, element, [name]);
      return value === null || typeof value === "string" ? value : null;
    } catch { return null; }
  }

  function elementTagName(element) {
    try {
      const value = Reflect.apply(nativeTagNameGetter, element, []);
      return typeof value === "string" ? value.toLowerCase() : "";
    } catch { return ""; }
  }

  function composedParent(element) {
    try {
      const parent = Reflect.apply(nativeParentElementGetter, element, []);
      if (parent) return parent;
      const root = Reflect.apply(nativeGetRootNode, element, []);
      if (!root || root === document) return null;
      const host = Reflect.apply(nativeShadowHostGetter, root, []);
      return host && host !== element ? host : null;
    } catch { return null; }
  }

  function semanticActionAvailable(element) {
    if (!element || typeof element !== "object") return false;
    let current = element;
    for (let steps = 0; current && steps < MAX_INTERACTION_ANCESTOR_STEPS; steps += 1) {
      let hidden;
      try { hidden = Reflect.apply(nativeHiddenGetter, current, []) === true; }
      catch { return false; }
      if (hidden || elementHasAttribute(current, "inert")) return false;
      if (elementAttribute(current, "aria-hidden") === "true" || elementAttribute(current, "aria-disabled") === "true") return false;
      if (elementTagName(current) === "fieldset") {
        try { if (Reflect.apply(nativeFieldSetDisabledGetter, current, []) === true) return false; }
        catch { return false; }
      }
      if (current === document.documentElement) return true;
      current = composedParent(current);
    }
    return false;
  }

  function elementIsVisible(element) {
    if (!nodeConnected(element) || !semanticActionAvailable(element)) return false;
    const style = computedStyle(element);
    const rect = boundingRect(element);
    if (!style || !rect) return false;
    const display = styleValue(style, "display");
    const visibility = styleValue(style, "visibility");
    const opacity = styleValue(style, "opacity");
    const pointerEvents = styleValue(style, "pointer-events");
    const width = rectNumber(rect, nativeRectWidthGetter);
    const height = rectNumber(rect, nativeRectHeightGetter);
    if ([display, visibility, opacity, pointerEvents].some((value) => value === null) || width === null || height === null) return false;
    if (display === "none" || visibility === "hidden" || visibility === "collapse" || Number(opacity) === 0 || pointerEvents === "none") return false;
    return width > 0 && height > 0;
  }

  function deepestHitFromPoint(x, y) {
    let hit;
    try { hit = Reflect.apply(nativeDocumentElementFromPoint, document, [x, y]); }
    catch { return null; }
    for (let depth = 0; hit && depth < MAX_HIT_TEST_SHADOW_DEPTH; depth += 1) {
      const shadowRoot = openShadowRoot(hit);
      if (!shadowRoot) return hit;
      const shadowElementFromPoint = captureData(shadowRoot, "elementFromPoint");
      if (typeof shadowElementFromPoint !== "function") return null;
      let nested;
      try { nested = Reflect.apply(shadowElementFromPoint, shadowRoot, [x, y]); }
      catch { return null; }
      if (!nested || nested === hit) return hit;
      hit = nested;
    }
    return hit;
  }

  function hitTestOwnsAction(element) {
    if (!elementIsVisible(element)) return false;
    const rect = boundingRect(element);
    if (!rect) return false;
    const viewportWidth = viewportNumber(nativeInnerWidthGetter);
    const viewportHeight = viewportNumber(nativeInnerHeightGetter);
    const rectLeft = rectNumber(rect, nativeRectLeftGetter);
    const rectRight = rectNumber(rect, nativeRectRightGetter);
    const rectTop = rectNumber(rect, nativeRectTopGetter);
    const rectBottom = rectNumber(rect, nativeRectBottomGetter);
    if (viewportWidth === null || viewportHeight === null || [rectLeft, rectRight, rectTop, rectBottom].some((value) => value === null)) return false;
    const left = Math.max(0, rectLeft);
    const right = Math.min(viewportWidth, rectRight);
    const top = Math.max(0, rectTop);
    const bottom = Math.min(viewportHeight, rectBottom);
    if (!(right > left && bottom > top)) return false;
    const hit = deepestHitFromPoint(left + ((right - left) / 2), top + ((bottom - top) / 2));
    return Boolean(hit && (hit === element || nodeContains(element, hit)));
  }

  function candidateSnapshotStillValid(snapshot) {
    const element = snapshot.element;
    const consentRoot = snapshot.consentRoot;
    if (!hitTestOwnsAction(element)) return false;
    if (!nodeConnected(consentRoot) || consentRoot === document.body || consentRoot === document.documentElement) return false;
    if (!nodeContains(consentRoot, element)) return false;
    let currentConsentRoot;
    try { currentConsentRoot = Reflect.apply(findConsentContainer, undefined, [element]); }
    catch { return false; }
    if (currentConsentRoot !== consentRoot) return false;
    try { if (Reflect.apply(isStrongConsentContainer, undefined, [consentRoot]) !== true) return false; }
    catch { return false; }
    let buttonLike;
    let owned;
    let currentText;
    let score;
    try {
      buttonLike = Reflect.apply(isButtonLike, undefined, [element]);
      owned = Reflect.apply(isDropAdsOwned, undefined, [element]);
      currentText = Reflect.apply(textSnapshot, undefined, [element]);
      score = currentText ? Reflect.apply(rejectionScore, undefined, [currentText]) : 0;
    } catch { return false; }
    if (!buttonLike || owned) return false;
    if (!currentText || currentText !== snapshot.text) return false;
    return Number.isSafeInteger(score) && score > 0 && score <= 100;
  }

  function candidateStillValid(candidate) {
    let snapshot;
    try { snapshot = Reflect.apply(snapshotCandidate, undefined, [candidate]); }
    catch { return false; }
    return Boolean(snapshot && candidateSnapshotStillValid(snapshot));
  }

  function activateRejectionCandidate(candidate) {
    let snapshot;
    try { snapshot = Reflect.apply(snapshotCandidate, undefined, [candidate]); }
    catch { return false; }
    if (!snapshot || !candidateSnapshotStillValid(snapshot)) return false;
    if (!hitTestOwnsAction(snapshot.element)) return false;
    try {
      Reflect.apply(nativeClick, snapshot.element, []);
      return true;
    } catch { return false; }
  }

  const api = Object.freeze({
    MAX_PLATFORM_PROTOTYPE_DEPTH,
    MAX_INTERACTION_ANCESTOR_STEPS,
    MAX_HIT_TEST_SHADOW_DEPTH,
    composedParent,
    semanticActionAvailable,
    elementIsVisible,
    deepestHitFromPoint,
    hitTestOwnsAction,
    candidateStillValid,
    activateRejectionCandidate
  });
  let existing;
  try { existing = Object.getOwnPropertyDescriptor(globalThis, EXECUTOR_GLOBAL); }
  catch { return; }
  if (existing) return;
  try {
    Object.defineProperty(globalThis, EXECUTOR_GLOBAL, {
      value: api,
      enumerable: false,
      writable: false,
      configurable: false
    });
  } catch {
    // Fail closed: controller will not initialize without the exact executor global.
  }
})();
