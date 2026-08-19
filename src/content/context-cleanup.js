(() => {
  const TARGET_TTL_MS = 10_000;
  const MAX_CONTEXT_TARGET_URL_CHARS = 16_384;
  const TARGET_MEMORY_OPTION_KEYS = Object.freeze(["ttlMs", "setTimeoutImpl", "clearTimeoutImpl"]);
  const REMEMBERED_TARGET_KEYS = Object.freeze(["element", "url", "capturedAt"]);
  const api = globalThis.browser ?? globalThis.chrome;
  const messageContract = globalThis.DropAdsContentMessageContract;

  function defaultComparableBase() {
    try {
      const locationRef = globalThis.location;
      if (locationRef == null) return "https://invalid.local/";
      const href = locationRef.href;
      return href == null ? "https://invalid.local/" : href;
    } catch {
      return null;
    }
  }

  function normalizeComparableUrl(value, base) {
    if (base === undefined) base = defaultComparableBase();
    if (typeof value !== "string" || !value || value.length > MAX_CONTEXT_TARGET_URL_CHARS) return null;
    if (typeof base !== "string" || !base || base.length > MAX_CONTEXT_TARGET_URL_CHARS) return null;
    try {
      const url = new URL(value, base);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      url.hash = "";
      return url.href;
    } catch {
      return null;
    }
  }

  function elementUrl(element) {
    let nodeType;
    let localName;
    try {
      if (!element) return null;
      nodeType = element.nodeType;
      localName = element.localName;
    } catch {
      return null;
    }
    if (nodeType !== 1 || typeof localName !== "string") return null;
    const tag = localName.toLowerCase();

    let candidate = null;
    try {
      if (tag === "img" || tag === "video" || tag === "audio") candidate = element.currentSrc || element.src;
      else if (tag === "iframe" || tag === "frame" || tag === "embed") candidate = element.src;
      else if (tag === "object") candidate = element.data;
      else if (tag === "a" || tag === "area") candidate = element.href;
      else return null;
    } catch {
      return null;
    }
    return normalizeComparableUrl(candidate);
  }

  function cleanupKindForTag(tagName) {
    if (typeof tagName !== "string") return "element";
    const tag = tagName.toLowerCase();
    if (tag === "img") return "image";
    if (tag === "video" || tag === "audio") return "media";
    if (tag === "iframe" || tag === "frame") return "frame";
    if (tag === "object" || tag === "embed") return "object";
    if (tag === "a" || tag === "area") return "link";
    return "element";
  }

  function isElementNode(value) {
    try { return Boolean(value) && value.nodeType === 1; }
    catch { return false; }
  }

  function explicitResourceTarget(start) {
    if (!isElementNode(start)) return null;
    if (elementUrl(start)) return start;
    let closest;
    try { closest = start.closest; }
    catch { return null; }
    if (typeof closest !== "function") return null;
    let link;
    try { link = Reflect.apply(closest, start, ["a[href],area[href]"]); }
    catch { return null; }
    return elementUrl(link) ? link : null;
  }

  function contextEventTarget(event) {
    try { return event?.target ?? null; }
    catch { return null; }
  }

  function boundedDimension(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return 0;
    return Math.min(4096, Math.ceil(value));
  }

  function makePlaceholder(element) {
    let documentRef;
    let createElement;
    try {
      documentRef = element?.ownerDocument ?? null;
      createElement = documentRef?.createElement;
    } catch {
      return null;
    }
    if (typeof createElement !== "function") return null;

    let rect = null;
    try { rect = element.getBoundingClientRect?.() ?? null; } catch { rect = null; }
    let rawWidth;
    let rawHeight;
    try { rawWidth = rect?.width; } catch { rawWidth = undefined; }
    try { rawHeight = rect?.height; } catch { rawHeight = undefined; }
    const width = boundedDimension(rawWidth);
    const height = boundedDimension(rawHeight);
    if (!width && !height) return null;

    try {
      const placeholder = Reflect.apply(createElement, documentRef, ["span"]);
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.setAttribute("role", "presentation");
      placeholder.setAttribute("data-drop-ads-placeholder", "true");
      placeholder.tabIndex = -1;
      placeholder.style.display = "inline-block";
      if (width) placeholder.style.width = `${width}px`;
      if (height) placeholder.style.height = `${height}px`;
      placeholder.style.maxWidth = "100%";
      placeholder.style.pointerEvents = "none";
      placeholder.style.userSelect = "none";
      placeholder.style.background = "transparent";
      return placeholder;
    } catch {
      return null;
    }
  }

  function cleanupElement(element) {
    let nodeType;
    let isConnected;
    let localName;
    let documentRef;
    try {
      if (!element) return { cleaned: false, reason: "target-missing" };
      nodeType = element.nodeType;
      isConnected = element.isConnected;
      localName = element.localName;
      documentRef = element.ownerDocument;
    } catch {
      return { cleaned: false, reason: "target-missing" };
    }
    if (nodeType !== 1 || isConnected === false) return { cleaned: false, reason: "target-missing" };
    const kind = cleanupKindForTag(localName);

    let active = null;
    try { active = documentRef?.activeElement ?? null; } catch { active = null; }
    if (active) {
      let ownsFocus = active === element;
      if (!ownsFocus) {
        try {
          const contains = element.contains;
          ownsFocus = typeof contains === "function" && Reflect.apply(contains, element, [active]) === true;
        } catch {
          ownsFocus = false;
        }
      }
      if (ownsFocus) {
        try {
          const blur = active.blur;
          if (typeof blur === "function") Reflect.apply(blur, active, []);
        } catch { /* focus cleanup is best effort */ }
      }
    }
    if (kind === "media") {
      try {
        const pause = element.pause;
        if (typeof pause === "function") Reflect.apply(pause, element, []);
      } catch { /* media may reject pause */ }
    }

    let placeholder = null;
    try { placeholder = makePlaceholder(element); } catch { placeholder = null; }
    if (placeholder) {
      let replaceWith = null;
      try { replaceWith = element.replaceWith; } catch { replaceWith = null; }
      if (typeof replaceWith === "function") {
        try {
          Reflect.apply(replaceWith, element, [placeholder]);
          return { cleaned: true, kind, placeholder: true };
        } catch {
          return { cleaned: false, reason: "target-not-removable" };
        }
      }
    }

    let remove = null;
    try { remove = element.remove; } catch { return { cleaned: false, reason: "target-not-removable" }; }
    if (typeof remove !== "function") return { cleaned: false, reason: "target-not-removable" };
    try {
      Reflect.apply(remove, element, []);
    } catch {
      return { cleaned: false, reason: "target-not-removable" };
    }
    return { cleaned: true, kind, placeholder: false };
  }

  function rememberedTargetSnapshot(value) {
    if (!value || typeof value !== "object") return null;
    let prototype;
    let keys;
    try {
      if (Array.isArray(value)) return null;
      prototype = Object.getPrototypeOf(value);
      keys = Reflect.ownKeys(value);
    } catch {
      return null;
    }
    if (prototype !== Object.prototype && prototype !== null) return null;
    if (keys.length !== REMEMBERED_TARGET_KEYS.length
      || keys.some((key) => typeof key !== "string" || !REMEMBERED_TARGET_KEYS.includes(key))) return null;

    const snapshot = Object.create(null);
    for (const key of REMEMBERED_TARGET_KEYS) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
      catch { return null; }
      if (!descriptor?.enumerable || !("value" in descriptor)) return null;
      snapshot[key] = descriptor.value;
    }
    if (typeof snapshot.url !== "string" || !snapshot.url || snapshot.url.length > MAX_CONTEXT_TARGET_URL_CHARS) return null;
    if (!Number.isFinite(snapshot.capturedAt) || snapshot.capturedAt < 0) return null;
    return snapshot;
  }

  function rememberedTargetStatus(remembered, requestedTargetUrl, now = Date.now()) {
    const snapshot = rememberedTargetSnapshot(remembered);
    if (!snapshot) return { matches: false, reason: "no-context-target" };
    if (!Number.isFinite(now) || now < 0 || now < snapshot.capturedAt) {
      return { matches: false, reason: "invalid-context-clock" };
    }
    if (now - snapshot.capturedAt > TARGET_TTL_MS) {
      return { matches: false, reason: "context-target-expired" };
    }
    let connected = false;
    try { connected = snapshot.element?.isConnected === true; }
    catch { connected = false; }
    if (!connected) return { matches: false, reason: "context-target-detached" };

    const requested = normalizeComparableUrl(requestedTargetUrl);
    if (!requested || requested !== snapshot.url) return { matches: false, reason: "context-target-mismatch" };

    let liveUrl = null;
    try { liveUrl = elementUrl(snapshot.element); } catch { liveUrl = null; }
    if (!liveUrl || liveUrl !== snapshot.url) return { matches: false, reason: "context-target-changed" };
    return { matches: true, reason: null };
  }

  function targetMemoryOptions(options) {
    if (options === undefined) options = {};
    if (!options || typeof options !== "object") throw new TypeError("Context target timer options must be an object");
    let isArray;
    let prototype;
    let keys;
    try {
      isArray = Array.isArray(options);
      prototype = Object.getPrototypeOf(options);
      keys = Reflect.ownKeys(options);
    } catch {
      throw new TypeError("Context target timer options are invalid");
    }
    if (isArray) throw new TypeError("Context target timer options must be an object");
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError("Context target timer options must be a plain object");
    if (keys.some((key) => typeof key !== "string" || !TARGET_MEMORY_OPTION_KEYS.includes(key))) throw new Error("Context target timer options contain an unknown field");
    const snapshot = Object.create(null);
    for (const key of TARGET_MEMORY_OPTION_KEYS) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(options, key); }
      catch { throw new TypeError("Context target timer options are invalid"); }
      if (!descriptor) continue;
      if (!descriptor.enumerable || !("value" in descriptor)) throw new TypeError(`Context target timer option ${key} must be an own enumerable data field`);
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  }

  function createTargetMemory(options) {
    const snapshot = targetMemoryOptions(options);
    const ttlMs = Object.hasOwn(snapshot, "ttlMs") ? snapshot.ttlMs : TARGET_TTL_MS;
    const setTimeoutImpl = Object.hasOwn(snapshot, "setTimeoutImpl") ? snapshot.setTimeoutImpl : setTimeout;
    const clearTimeoutImpl = Object.hasOwn(snapshot, "clearTimeoutImpl") ? snapshot.clearTimeoutImpl : clearTimeout;
    if (!Number.isInteger(ttlMs) || ttlMs <= 0 || ttlMs > TARGET_TTL_MS) throw new Error("Context target TTL is invalid");
    if (typeof setTimeoutImpl !== "function") throw new TypeError("Context target setTimeout collaborator must be a function");
    if (typeof clearTimeoutImpl !== "function") throw new TypeError("Context target clearTimeout collaborator must be a function");
    let remembered = null;
    let timer = null;
    let generation = 0;

    function cancelHandle(handle) {
      if (handle == null) return;
      try { clearTimeoutImpl(handle); } catch { /* releasing remembered DOM state must not depend on timer cancellation */ }
    }

    function clear() {
      generation += 1;
      const previousTimer = timer;
      timer = null;
      remembered = null;
      cancelHandle(previousTimer);
    }

    function remember(value) {
      clear();
      if (!value) return;
      remembered = value;
      const token = generation;
      let scheduledHandle;
      try {
        scheduledHandle = setTimeoutImpl(() => {
          if (generation !== token) return;
          timer = null;
          remembered = null;
          generation += 1;
        }, ttlMs);
      } catch (error) {
        if (generation === token) {
          timer = null;
          remembered = null;
          generation += 1;
        }
        throw error;
      }
      if (generation !== token) {
        cancelHandle(scheduledHandle);
        return;
      }
      timer = scheduledHandle;
    }

    function take() {
      const value = remembered;
      clear();
      return value;
    }

    return Object.freeze({ remember, take, clear, peek: () => remembered });
  }

  const targetMemory = createTargetMemory();

  function rememberContextTarget(event) {
    const target = explicitResourceTarget(contextEventTarget(event));
    if (!target) {
      targetMemory.clear();
      return;
    }
    const url = elementUrl(target);
    if (!url) {
      targetMemory.clear();
      return;
    }
    targetMemory.remember({ element: target, url, capturedAt: Date.now() });
  }

  function cleanupRememberedTarget(message) {
    const remembered = targetMemory.take();
    const status = rememberedTargetStatus(remembered, message.targetUrl);
    if (!status.matches) return { cleaned: false, reason: status.reason };
    return cleanupElement(remembered.element);
  }

  globalThis.DropAdsContextCleanup = Object.freeze({
    TARGET_TTL_MS,
    normalizeComparableUrl,
    elementUrl,
    cleanupKindForTag,
    cleanupElement,
    rememberedTargetStatus,
    createTargetMemory,
    explicitResourceTarget,
    contextEventTarget
  });

  if (typeof document !== "undefined" && api?.runtime?.onMessage && messageContract) {
    document.addEventListener("contextmenu", rememberContextTarget, true);
    globalThis.addEventListener?.("pagehide", () => targetMemory.clear(), { once: true });
    api.runtime.onMessage.addListener((message) => {
      const snapshot = messageContract.snapshot(message, "drop-ads:cleanup-context-target");
      if (!snapshot) return undefined;
      return Promise.resolve(cleanupRememberedTarget(snapshot));
    });
  }
})();
