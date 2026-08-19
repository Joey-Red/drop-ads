(() => {
  const PICKER_SESSION_TTL_MS = 2 * 60 * 1000;
  const PICKER_TIMER_OPTION_KEYS = Object.freeze(["ttlMs", "setTimeoutImpl", "clearTimeoutImpl", "onExpire"]);
  const MAX_PICKER_EVENT_PROTOTYPE_DEPTH = 8;
  const MAX_PICKER_EVENT_PATH_ENTRIES = 256;
  const api = globalThis.browser ?? globalThis.chrome;
  const helpers = globalThis.DropAdsSelectorUtils;
  const messageContract = globalThis.DropAdsContentMessageContract;
  const saveGuard = globalThis.DropAdsPickerSaveGuard;
  const pickerUi = globalThis.DropAdsPickerUi;

  let active = null;
  let sessionSequence = 0;

  function pickerTimerOptions(options) {
    if (options === undefined) options = {};
    if (!options || typeof options !== "object") throw new TypeError("Picker timer options must be an object");
    let isArray;
    let prototype;
    let keys;
    try {
      isArray = Array.isArray(options);
      prototype = Object.getPrototypeOf(options);
      keys = Reflect.ownKeys(options);
    } catch {
      throw new TypeError("Picker timer options are invalid");
    }
    if (isArray) throw new TypeError("Picker timer options must be an object");
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError("Picker timer options must be a plain object");
    if (keys.some((key) => typeof key !== "string" || !PICKER_TIMER_OPTION_KEYS.includes(key))) throw new Error("Picker timer options contain an unknown field");
    const snapshot = Object.create(null);
    for (const key of PICKER_TIMER_OPTION_KEYS) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(options, key); }
      catch { throw new TypeError("Picker timer options are invalid"); }
      if (!descriptor) continue;
      if (!descriptor.enumerable || !("value" in descriptor)) throw new TypeError(`Picker timer option ${key} must be an own enumerable data field`);
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  }

  function createPickerSessionTimer(options) {
    const snapshot = pickerTimerOptions(options);
    const ttlMs = Object.hasOwn(snapshot, "ttlMs") ? snapshot.ttlMs : PICKER_SESSION_TTL_MS;
    const setTimeoutImpl = Object.hasOwn(snapshot, "setTimeoutImpl") ? snapshot.setTimeoutImpl : setTimeout;
    const clearTimeoutImpl = Object.hasOwn(snapshot, "clearTimeoutImpl") ? snapshot.clearTimeoutImpl : clearTimeout;
    const onExpire = Object.hasOwn(snapshot, "onExpire") ? snapshot.onExpire : () => {};
    if (!Number.isInteger(ttlMs) || ttlMs <= 0 || ttlMs > PICKER_SESSION_TTL_MS) throw new Error("Picker session TTL is invalid");
    if (typeof setTimeoutImpl !== "function") throw new TypeError("Picker setTimeout collaborator must be a function");
    if (typeof clearTimeoutImpl !== "function") throw new TypeError("Picker clearTimeout collaborator must be a function");
    if (typeof onExpire !== "function") throw new TypeError("Picker expiry callback must be a function");
    let timer = null;
    let generation = 0;

    function cancelHandle(handle) {
      if (handle == null) return;
      try { clearTimeoutImpl(handle); } catch { /* timer cancellation is best effort */ }
    }

    function arm() {
      generation += 1;
      const token = generation;
      const previous = timer;
      timer = null;
      cancelHandle(previous);

      let handle;
      try {
        handle = setTimeoutImpl(() => {
          if (generation !== token) return;
          timer = null;
          generation += 1;
          try { onExpire(token); } catch { /* expiry failure must not resurrect timer state */ }
        }, ttlMs);
      } catch (error) {
        if (generation === token) generation += 1;
        timer = null;
        throw error;
      }

      if (generation !== token) {
        cancelHandle(handle);
        return token;
      }
      timer = handle;
      return token;
    }

    function cancel() {
      generation += 1;
      const handle = timer;
      timer = null;
      cancelHandle(handle);
    }

    return Object.freeze({ arm, cancel });
  }

  function inheritedEventMethod(event, key) {
    if (!event || (typeof event !== "object" && typeof event !== "function")) return null;
    try {
      if (Object.getOwnPropertyDescriptor(event, key)) return null;
      let prototype = Object.getPrototypeOf(event);
      for (let depth = 0; prototype && depth < MAX_PICKER_EVENT_PROTOTYPE_DEPTH; depth += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
        if (descriptor) return "value" in descriptor && typeof descriptor.value === "function" ? descriptor.value : null;
        prototype = Object.getPrototypeOf(prototype);
      }
    } catch {
      return null;
    }
    return null;
  }

  function ownedByPicker(event, host) {
    const composedPath = inheritedEventMethod(event, "composedPath");
    if (!composedPath) return false;
    try {
      const path = Reflect.apply(composedPath, event, []);
      if (!Array.isArray(path)) return false;
      const lengthDescriptor = Object.getOwnPropertyDescriptor(path, "length");
      if (!lengthDescriptor || !("value" in lengthDescriptor)
        || !Number.isSafeInteger(lengthDescriptor.value)
        || lengthDescriptor.value < 0
        || lengthDescriptor.value > MAX_PICKER_EVENT_PATH_ENTRIES) return false;
      for (let index = 0; index < lengthDescriptor.value; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(path, String(index));
        if (!descriptor || !("value" in descriptor)) return false;
        if (descriptor.value === host) return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  function pickerElementTarget(value) {
    try { return value && value.nodeType === 1 ? value : null; }
    catch { return null; }
  }

  function pickerEventTarget(event) {
    try { return pickerElementTarget(event?.target); }
    catch { return null; }
  }

  function pickerEventKey(event) {
    try {
      const key = event?.key;
      return typeof key === "string" ? key : null;
    } catch {
      return null;
    }
  }

  function pickerHostContains(host, element) {
    if (!pickerElementTarget(element)) return false;
    try {
      const contains = host?.contains;
      return typeof contains === "function" && Reflect.apply(contains, host, [element]) === true;
    } catch {
      return false;
    }
  }

  function suppressPickerEvent(event) {
    for (const key of ["preventDefault", "stopImmediatePropagation"]) {
      const method = inheritedEventMethod(event, key);
      if (!method) continue;
      try { Reflect.apply(method, event, []); } catch { /* suppression is best effort */ }
    }
  }

  function pickerRectSnapshot(element) {
    try {
      if (!element || element.isConnected !== true) return null;
      const getBoundingClientRect = element.getBoundingClientRect;
      if (typeof getBoundingClientRect !== "function") return null;
      const rect = Reflect.apply(getBoundingClientRect, element, []);
      if (!rect || (typeof rect !== "object" && typeof rect !== "function")) return null;
      const left = rect.left;
      const top = rect.top;
      const width = rect.width;
      const height = rect.height;
      if (![left, top, width, height].every((value) => typeof value === "number" && Number.isFinite(value))) return null;
      if (width <= 0 || height <= 0) return null;
      return Object.freeze({ left, top, width, height });
    } catch {
      return null;
    }
  }

  function bestEffortRemoveEventListener(target, type, listener, options) {
    if (!target || typeof type !== "string" || typeof listener !== "function") return;
    try {
      const removeEventListener = target.removeEventListener;
      if (typeof removeEventListener === "function") Reflect.apply(removeEventListener, target, [type, listener, options]);
    } catch { /* picker listener cleanup is best effort */ }
  }

  function registerPickerListener(registrations, target, type, listener, options) {
    if (!Array.isArray(registrations) || !target || typeof type !== "string" || typeof listener !== "function") return false;
    try {
      const addEventListener = target.addEventListener;
      if (typeof addEventListener !== "function") return false;
      Reflect.apply(addEventListener, target, [type, listener, options]);
      registrations.push(Object.freeze({ target, type, listener, options }));
      return true;
    } catch {
      return false;
    }
  }

  function clearPickerListeners(registrations) {
    if (!Array.isArray(registrations)) return;
    while (registrations.length) {
      const registration = registrations.pop();
      bestEffortRemoveEventListener(registration.target, registration.type, registration.listener, registration.options);
    }
  }

  function bestEffortPickerText(node, text) {
    if (!node || typeof text !== "string") return false;
    try {
      node.textContent = text;
      return true;
    } catch {
      return false;
    }
  }

  function bestEffortPickerDisabled(control, disabled) {
    if (!control || typeof disabled !== "boolean") return false;
    try {
      control.disabled = disabled;
      return true;
    } catch {
      return false;
    }
  }

  function bestEffortPickerStyle(node, property, value) {
    if (!node || typeof property !== "string" || typeof value !== "string") return false;
    try {
      const style = node.style;
      if (!style) return false;
      style[property] = value;
      return true;
    } catch {
      return false;
    }
  }

  function bestEffortPickerFocus(control) {
    if (!control) return false;
    try {
      const focus = control.focus;
      if (typeof focus !== "function") return false;
      Reflect.apply(focus, control, []);
      return true;
    } catch {
      return false;
    }
  }

  function pickerHostConnected(host) {
    if (!host) return false;
    try { return host.isConnected === true; }
    catch { return false; }
  }

  function bestEffortActiveCleanup(session) {
    if (!session) return;
    try {
      const cleanup = session.cleanup;
      if (typeof cleanup === "function") Reflect.apply(cleanup, session, []);
    } catch { /* stale active cleanup is best effort */ }
  }

  function bestEffortRemoveNode(node) {
    if (!node) return;
    try {
      const remove = node.remove;
      if (typeof remove === "function") Reflect.apply(remove, node, []);
    } catch { /* picker host cleanup is best effort */ }
  }

  function startPicker() {
    if (active) {
      if (pickerHostConnected(active.host)) return;
      const stale = active;
      active = null;
      bestEffortActiveCleanup(stale);
    }
    const sessionId = ++sessionSequence;
    let host = null;
    let cleanup = null;
    let ui = null;
    try {
      host = document.createElement("div");
      host.setAttribute("data-drop-ads-extension", "picker");
      host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
      ui = pickerUi.create(host);
      (document.documentElement ?? document.body)?.append(host);

      const box = ui.box;
      const message = ui.message;
      const candidateNode = ui.candidate;
      const actions = ui.actions;
      const save = ui.save;
      const cancel = ui.cancel;
      const listenerRegistrations = [];
      let target = null;
      let candidate = null;
      let selecting = true;
      let saving = false;
      let cleaned = false;
      let cleanupRef = () => {};
      const lifetime = createPickerSessionTimer({ onExpire: () => cleanupRef() });

      function positionBox(element) {
        const rect = pickerRectSnapshot(element);
        if (!rect) {
          bestEffortPickerStyle(box, "display", "none");
          return;
        }
        bestEffortPickerStyle(box, "display", "block");
        bestEffortPickerStyle(box, "left", `${Math.max(0, rect.left)}px`);
        bestEffortPickerStyle(box, "top", `${Math.max(0, rect.top)}px`);
        bestEffortPickerStyle(box, "width", `${Math.max(1, rect.width)}px`);
        bestEffortPickerStyle(box, "height", `${Math.max(1, rect.height)}px`);
      }

      function setTarget(element) {
        const eligible = pickerElementTarget(element);
        if (!selecting || !eligible || eligible === host || pickerHostContains(host, eligible)) return;
        target = eligible;
        positionBox(target);
      }

      cleanup = function cleanupSession() {
        if (cleaned) return;
        cleaned = true;
        if (active?.sessionId === sessionId) active = null;
        target = null;
        candidate = null;
        selecting = false;
        saving = false;
        cleanupRef = () => {};
        lifetime.cancel();
        clearPickerListeners(listenerRegistrations);
        try { ui?.dispose?.(); } catch { /* picker UI teardown is best effort */ }
        ui = null;
        bestEffortRemoveNode(host);
      };
      cleanupRef = cleanup;

      function choose(element) {
        let nextCandidate;
        try {
          nextCandidate = helpers.generateStableSelector(element, document);
          positionBox(element);
          const previewPublished = bestEffortPickerText(candidateNode, nextCandidate)
            && bestEffortPickerStyle(candidateNode, "display", "block")
            && bestEffortPickerStyle(actions, "display", "flex")
            && bestEffortPickerText(message, "Preview selected. The rule will be stored locally and scoped to this site.")
            && bestEffortPickerFocus(save);
          if (!previewPublished) throw new Error("Could not publish picker preview");
          candidate = nextCandidate;
          selecting = false;
        } catch (error) {
          candidate = null;
          selecting = true;
          bestEffortPickerText(candidateNode, "");
          bestEffortPickerStyle(candidateNode, "display", "none");
          bestEffortPickerStyle(actions, "display", "none");
          let failureText = "Could not build or preview a stable selector. Choose a more specific element.";
          try {
            const formatted = messageContract.contentCaughtErrorMessage(error, failureText);
            if (typeof formatted === "string" && formatted) failureText = formatted;
          } catch { /* retain reviewed preview fallback */ }
          bestEffortPickerText(message, failureText);
        }
      }

      function onMove(event) { if (!ownedByPicker(event, host)) setTarget(pickerEventTarget(event)); }
      function onFocus(event) { if (!ownedByPicker(event, host)) setTarget(pickerEventTarget(event)); }
      function onClick(event) {
        if (ownedByPicker(event, host) || !selecting) return;
        suppressPickerEvent(event);
        if (target) choose(target);
      }
      function onKey(event) {
        const key = pickerEventKey(event);
        if (key === "Escape") {
          suppressPickerEvent(event);
          cleanup();
          return;
        }
        if (key === "Enter" && selecting && target && !ownedByPicker(event, host)) {
          suppressPickerEvent(event);
          choose(target);
        }
      }
      function onViewport() { if (target) positionBox(target); }
      function onPageHide() { cleanup(); }

      save.addEventListener("click", async () => {
        if (!candidate || saving) return;
        saving = true;
        try {
          bestEffortPickerDisabled(save, true);
          bestEffortPickerDisabled(cancel, true);
          bestEffortPickerText(message, "Saving local cosmetic rule…");
          saveGuard.verifyCandidate(candidate, target, document);
          const response = messageContract.snapshotCosmeticMutationResponse(await api.runtime.sendMessage({
            type: "drop-ads:add-cosmetic-rule",
            field: "personalCosmeticHide",
            rule: { selector: candidate, domains: [location.hostname] }
          }));
          if (!response) throw new Error("Could not save cosmetic rule");
          if (!response.ok) throw new Error(response.error);
          cleanup();
        } catch (error) {
          saving = false;
          let failureText = "Could not save cosmetic rule";
          try {
            const formatted = messageContract.contentCaughtErrorMessage(error, failureText);
            if (typeof formatted === "string") failureText = formatted;
          } catch { /* retain reviewed fallback */ }
          bestEffortPickerText(message, failureText);
          bestEffortPickerDisabled(save, false);
          bestEffortPickerDisabled(cancel, false);
        }
      });
      cancel.addEventListener("click", cleanup);

      const requiredListeners = [
        [document, "mousemove", onMove, true],
        [document, "focusin", onFocus, true],
        [document, "click", onClick, true],
        [document, "keydown", onKey, true],
        [window, "scroll", onViewport, true],
        [window, "resize", onViewport, true],
        [window, "pagehide", onPageHide, true]
      ];
      for (const [targetObject, type, listener, options] of requiredListeners) {
        if (!registerPickerListener(listenerRegistrations, targetObject, type, listener, options)) {
          throw new Error(`Could not register picker ${type} listener`);
        }
      }

      active = { sessionId, cleanup, host };
      try {
        lifetime.arm();
      } catch (error) {
        cleanup();
        throw error;
      }
    } catch (error) {
      if (cleanup) cleanup();
      else {
        try { ui?.dispose?.(); } catch { /* picker UI teardown is best effort */ }
        bestEffortRemoveNode(host);
      }
      throw error;
    }
  }

  function bestEffortPickerStartResponse(sendResponse, payload) {
    if (typeof sendResponse !== "function") return false;
    try {
      Reflect.apply(sendResponse, null, [payload]);
      return true;
    } catch {
      return false;
    }
  }

  function pickerStartFailureText(error) {
    const fallback = "Could not start element picker";
    try {
      const formatted = messageContract.contentCaughtErrorMessage(error, fallback);
      return typeof formatted === "string" && formatted ? formatted : fallback;
    } catch {
      return fallback;
    }
  }

  globalThis.DropAdsPickerLifecycle = Object.freeze({
    PICKER_SESSION_TTL_MS,
    MAX_PICKER_EVENT_PROTOTYPE_DEPTH,
    MAX_PICKER_EVENT_PATH_ENTRIES,
    createPickerSessionTimer,
    ownedByPicker,
    pickerRectSnapshot,
    pickerElementTarget,
    pickerEventTarget,
    pickerEventKey,
    pickerHostContains,
    suppressPickerEvent,
    bestEffortRemoveEventListener,
    registerPickerListener,
    clearPickerListeners,
    bestEffortPickerText,
    bestEffortPickerDisabled,
    bestEffortPickerStyle,
    bestEffortPickerFocus,
    pickerHostConnected,
    bestEffortActiveCleanup,
    bestEffortRemoveNode,
    bestEffortPickerStartResponse,
    pickerStartFailureText
  });

  // Pure lifecycle helpers remain available even if another content-script dependency
  // failed to initialize. The picker itself still fails closed by not installing its
  // runtime listener until every required collaborator is present.
  if (!api?.runtime?.onMessage || !helpers || !messageContract || !saveGuard || !pickerUi) return;

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!messageContract.accepts(message, "drop-ads:start-element-picker")) return false;
    try {
      startPicker();
      bestEffortPickerStartResponse(sendResponse, { ok: true });
    } catch (error) {
      bestEffortPickerStartResponse(sendResponse, { ok: false, error: pickerStartFailureText(error) });
    }
    return false;
  });
})();
