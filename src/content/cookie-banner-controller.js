(() => {
  const MESSAGE_TYPE = "drop-ads:get-cookie-banner-policy";
  const MAX_SCAN_ATTEMPTS = 16;
  const MAX_OBSERVE_MS = 30_000;
  const MUTATION_SETTLE_MS = 150;
  const MAX_API_PROTOTYPE_DEPTH = 8;
  const OBSERVATION_OPTIONS = Object.freeze({
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: Object.freeze(["aria-label", "aria-disabled", "class", "hidden", "role", "style", "title"])
  });
  let active = true;
  let started = false;
  let attempts = 0;
  let observer = null;
  let stopTimer = null;
  let scanTimer = null;
  let domReadyHandler = null;
  const observedTargets = new Set();

  function ownDataValue(object, key) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
    catch { return null; }
    return descriptor && "value" in descriptor && !descriptor.get && !descriptor.set ? descriptor.value : null;
  }

  function exactFrozenApi(globalName, expectedKeys) {
    const apiValue = ownDataValue(globalThis, globalName);
    let prototype;
    let keys;
    try { prototype = Object.getPrototypeOf(apiValue); keys = Reflect.ownKeys(apiValue); }
    catch { return null; }
    if (!apiValue || prototype !== Object.prototype || !Object.isFrozen(apiValue) || keys.length !== expectedKeys.length) return null;
    const expected = new Set(expectedKeys);
    if (keys.some((key) => typeof key !== "string" || !expected.has(key))) return null;
    const values = Object.create(null);
    for (const key of expectedKeys) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(apiValue, key); }
      catch { return null; }
      if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set
        || !descriptor.enumerable || descriptor.writable || descriptor.configurable) return null;
      values[key] = descriptor.value;
    }
    return Object.freeze(values);
  }

  const composition = ownDataValue(globalThis, "DropAdsCookieBannerUtilsComposition");
  const snapshotUtils = ownDataValue(composition, "snapshotUtils");
  if (!composition || !Object.isFrozen(composition) || typeof snapshotUtils !== "function") return;
  let utils;
  try { utils = Reflect.apply(snapshotUtils, composition, []); }
  catch { return; }
  if (!utils) return;
  const snapshotCandidateArray = ownDataValue(utils, "snapshotCandidateArray");
  const rejectionScore = ownDataValue(utils, "rejectionScore");
  const discoverActionCandidates = ownDataValue(utils, "discoverActionCandidates");
  if (![snapshotCandidateArray, rejectionScore, discoverActionCandidates].every((value) => typeof value === "function")) return;

  const executor = exactFrozenApi("DropAdsCookieBannerExecutor", [
    "MAX_PLATFORM_PROTOTYPE_DEPTH", "MAX_INTERACTION_ANCESTOR_STEPS", "MAX_HIT_TEST_SHADOW_DEPTH",
    "composedParent", "semanticActionAvailable", "elementIsVisible", "deepestHitFromPoint", "hitTestOwnsAction",
    "candidateStillValid", "activateRejectionCandidate"
  ]);
  const shadowRoots = exactFrozenApi("DropAdsCookieBannerShadowRoots", [
    "MAX_SHADOW_SCAN_NODES", "MAX_OPEN_SHADOW_ROOTS", "MAX_OPEN_SHADOW_DEPTH", "collectOpenShadowRoots"
  ]);
  const consentSafety = exactFrozenApi("DropAdsCookieBannerConsentSafety", ["isStrongConsentContainer"]);
  if (!executor || !shadowRoots || !consentSafety) return;
  const activateRejectionCandidate = ownDataValue(executor, "activateRejectionCandidate");
  const collectOpenShadowRoots = ownDataValue(shadowRoots, "collectOpenShadowRoots");
  const isStrongConsentContainer = ownDataValue(consentSafety, "isStrongConsentContainer");
  if (![activateRejectionCandidate, collectOpenShadowRoots, isStrongConsentContainer].every((value) => typeof value === "function")) return;

  function captureData(receiver, key) {
    if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) return null;
    let current = receiver;
    for (let depth = 0; current && depth <= MAX_API_PROTOTYPE_DEPTH; depth += 1) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
      catch { return null; }
      if (descriptor) return "value" in descriptor ? descriptor.value : null;
      try { current = Object.getPrototypeOf(current); }
      catch { return null; }
    }
    return null;
  }

  function captureGetter(receiver, key) {
    if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) return null;
    let current = receiver;
    for (let depth = 0; current && depth <= MAX_API_PROTOTYPE_DEPTH; depth += 1) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
      catch { return null; }
      if (descriptor) return typeof descriptor.get === "function" && !("value" in descriptor) ? descriptor.get : null;
      try { current = Object.getPrototypeOf(current); }
      catch { return null; }
    }
    return null;
  }

  function readGetter(getter, receiver) {
    if (typeof getter !== "function") return null;
    try { return Reflect.apply(getter, receiver, []); }
    catch { return null; }
  }

  function capturedGlobalValue(key) {
    const data = captureData(globalThis, key);
    if (data !== null && data !== undefined) return data;
    return readGetter(captureGetter(globalThis, key), globalThis);
  }

  function captureMethod(receiver, key) {
    const callback = captureData(receiver, key);
    if (typeof callback !== "function") return null;
    return (...args) => Reflect.apply(callback, receiver, args);
  }

  function captureSendMessage(browserApi) {
    const runtime = captureData(browserApi, "runtime");
    return captureMethod(runtime, "sendMessage");
  }

  const api = capturedGlobalValue("browser") ?? capturedGlobalValue("chrome");
  const topGetter = captureGetter(globalThis, "top");
  const locationGetter = captureGetter(globalThis, "location");
  const documentGetter = captureGetter(globalThis, "document");
  const location = readGetter(locationGetter, globalThis);
  const pageDocument = readGetter(documentGetter, globalThis);
  const protocolGetter = captureGetter(location, "protocol");
  const hostnameGetter = captureGetter(location, "hostname");
  const documentElementGetter = captureGetter(pageDocument, "documentElement");
  const readyStateGetter = captureGetter(pageDocument, "readyState");
  const sendMessage = captureSendMessage(api);
  const Observer = captureData(globalThis, "MutationObserver");
  const ObserverPrototype = captureData(Observer, "prototype");
  const observerObserve = captureData(ObserverPrototype, "observe");
  const observerDisconnect = captureData(ObserverPrototype, "disconnect");
  const scheduleTimeout = captureMethod(globalThis, "setTimeout");
  const cancelTimeout = captureMethod(globalThis, "clearTimeout");
  const addDocumentListener = captureMethod(pageDocument, "addEventListener");
  const removeDocumentListener = captureMethod(pageDocument, "removeEventListener");
  const addGlobalListener = captureMethod(globalThis, "addEventListener");
  const removeGlobalListener = captureMethod(globalThis, "removeEventListener");
  if (!api || !topGetter || !location || !pageDocument || !protocolGetter || !hostnameGetter
    || !documentElementGetter || !readyStateGetter
    || typeof Observer !== "function" || !ObserverPrototype
    || typeof observerObserve !== "function" || typeof observerDisconnect !== "function"
    || !sendMessage || !scheduleTimeout || !cancelTimeout
    || !addDocumentListener || !removeDocumentListener || !addGlobalListener || !removeGlobalListener) return;
  if (readGetter(topGetter, globalThis) !== globalThis) return;

  function currentDocumentElement() {
    const root = readGetter(documentElementGetter, pageDocument);
    return root && typeof root === "object" ? root : null;
  }

  function currentReadyState() {
    const state = readGetter(readyStateGetter, pageDocument);
    return typeof state === "string" ? state : "";
  }

  function documentDomain() {
    const protocol = readGetter(protocolGetter, location);
    if (protocol !== "http:" && protocol !== "https:") return "";
    const domain = readGetter(hostnameGetter, location);
    if (typeof domain !== "string" || !domain || domain.length > 253) return "";
    if (domain !== domain.toLowerCase()) return "";
    return domain;
  }

  function enabledPolicyResponse(value) {
    if (!value || typeof value !== "object") return false;
    let prototype;
    let isArray;
    let keys;
    try {
      prototype = Object.getPrototypeOf(value);
      isArray = Array.isArray(value);
      keys = Reflect.ownKeys(value);
    } catch {
      return false;
    }
    if (isArray || (prototype !== Object.prototype && prototype !== null)) return false;
    if (keys.length !== 1 || keys[0] !== "enabled") return false;
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, "enabled"); }
    catch { return false; }
    return Boolean(
      descriptor
      && descriptor.enumerable === true
      && "value" in descriptor
      && typeof descriptor.value === "boolean"
      && descriptor.value === true
    );
  }

  function selectUnambiguousCandidate(candidates) {
    let snapshots;
    try { snapshots = Reflect.apply(snapshotCandidateArray, undefined, [candidates]); }
    catch { return null; }
    if (!snapshots) return null;
    let best = null;
    let bestScore = 0;
    let ambiguous = false;
    for (const candidate of snapshots) {
      let strong;
      let score;
      try {
        strong = Reflect.apply(isStrongConsentContainer, undefined, [candidate.consentRoot]);
        score = strong ? Reflect.apply(rejectionScore, undefined, [candidate.text]) : 0;
      } catch { return null; }
      if (strong !== true || !Number.isSafeInteger(score) || score < 0 || score > 100) continue;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
        ambiguous = false;
      } else if (score > 0 && score === bestScore) {
        ambiguous = true;
      }
    }
    return bestScore > 0 && !ambiguous ? best : null;
  }

  function clearTimer(timer) {
    if (timer === null) return;
    try { cancelTimeout(timer); } catch { /* Best-effort teardown. */ }
  }

  function stop() {
    if (!active) return;
    active = false;
    try { observer?.disconnect(); } catch { /* Best-effort teardown. */ }
    observer = null;
    observedTargets.clear();
    if (domReadyHandler) {
      try { removeDocumentListener("DOMContentLoaded", domReadyHandler); } catch { /* Best-effort teardown. */ }
      domReadyHandler = null;
    }
    try { removeGlobalListener("pagehide", stop); } catch { /* Best-effort teardown. */ }
    clearTimer(stopTimer);
    clearTimer(scanTimer);
    stopTimer = null;
    scanTimer = null;
  }

  function observeTargetOnce(target) {
    if (!active || !observer || !target || observedTargets.has(target)) return true;
    try {
      observer.observe(target, OBSERVATION_OPTIONS);
      observedTargets.add(target);
      return true;
    } catch {
      stop();
      return false;
    }
  }

  function syncOpenShadowObservation() {
    if (!active || !observer) return false;
    const root = currentDocumentElement();
    if (!root) {
      stop();
      return false;
    }
    let roots;
    try { roots = Reflect.apply(collectOpenShadowRoots, undefined, [root]); }
    catch {
      stop();
      return false;
    }
    if (!Array.isArray(roots) || !Object.isFrozen(roots)) {
      stop();
      return false;
    }
    for (const shadowRoot of roots) {
      if (!observeTargetOnce(shadowRoot)) return false;
    }
    return true;
  }

  function scanForRejection() {
    scanTimer = null;
    if (!active) return false;
    attempts += 1;
    const root = currentDocumentElement();
    if (!root) {
      stop();
      return false;
    }
    let candidates;
    try { candidates = Reflect.apply(discoverActionCandidates, undefined, [root]); }
    catch { candidates = null; }
    if (!candidates || !active) return false;
    const candidate = selectUnambiguousCandidate(candidates);
    let activated = false;
    if (candidate) {
      try { activated = Reflect.apply(activateRejectionCandidate, undefined, [candidate]) === true; }
      catch { activated = false; }
    }
    if (activated) {
      stop();
      return true;
    }
    if (attempts >= MAX_SCAN_ATTEMPTS) stop();
    return false;
  }

  function scheduleMutationScan() {
    if (!active || scanTimer !== null) return;
    if (!syncOpenShadowObservation()) return;
    try {
      scanTimer = scheduleTimeout(() => { scanForRejection(); }, MUTATION_SETTLE_MS);
    } catch {
      stop();
    }
  }

  function beginObservation() {
    if (!active || attempts >= MAX_SCAN_ATTEMPTS) {
      stop();
      return;
    }
    const root = currentDocumentElement();
    if (!root) {
      stop();
      return;
    }
    try {
      const instance = Reflect.construct(Observer, [() => { scheduleMutationScan(); }]);
      const observe = (target, options) => Reflect.apply(observerObserve, instance, [target, options]);
      const disconnect = () => Reflect.apply(observerDisconnect, instance, []);
      observer = Object.freeze({ observe, disconnect });
      if (!observeTargetOnce(root) || !syncOpenShadowObservation()) return;
    } catch {
      stop();
      return;
    }
    try {
      stopTimer = scheduleTimeout(stop, MAX_OBSERVE_MS);
    } catch {
      stop();
    }
  }

  async function runOnce() {
    if (!active || started) return false;
    started = true;
    const domain = documentDomain();
    if (!domain) {
      stop();
      return false;
    }

    let response;
    try {
      response = await sendMessage(Object.freeze({ type: MESSAGE_TYPE, domain }));
    } catch {
      stop();
      return false;
    }
    if (!active || !enabledPolicyResponse(response)) {
      stop();
      return false;
    }

    const activated = scanForRejection();
    if (!activated && active) beginObservation();
    return activated;
  }

  function startWhenReady() {
    if (!active || started) return;
    const state = currentReadyState();
    if (!state) {
      stop();
      return;
    }
    if (state === "loading") {
      domReadyHandler = () => {
        domReadyHandler = null;
        void runOnce();
      };
      try { addDocumentListener("DOMContentLoaded", domReadyHandler, { once: true }); }
      catch { stop(); }
      return;
    }
    void runOnce();
  }

  try { addGlobalListener("pagehide", stop, { once: true }); }
  catch {
    stop();
    return;
  }
  startWhenReady();
})();
