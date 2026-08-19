(() => {
  const UTILS_GLOBAL = "DropAdsCookieBannerUtils";
  const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;
  const MAX_COOKIE_BANNER_SCAN_NODES = 2_000;
  const MAX_COOKIE_BANNER_CANDIDATES = 64;
  const MAX_COOKIE_BANNER_TEXT_CHARS = 160;
  const MAX_ACTION_TEXT_NODES = 32;
  const MAX_ACTION_RAW_CHARS = 512;
  const MAX_ARIA_LABELLEDBY_IDS = 4;
  const MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256;
  const MAX_ARIA_REFERENCE_TEXT_NODES = 16;
  const MAX_ARIA_REFERENCE_RAW_CHARS = 256;
  const MAX_CONSENT_ANCESTOR_STEPS = 10;
  const MAX_CONSENT_TEXT_NODES = 96;
  const MAX_CONSENT_CONTEXT_CHARS = 1_200;
  const MAX_CONSENT_RAW_FIELD_CHARS = 2_400;
  const MAX_CONSENT_CONTEXT_EVALUATIONS = 256;
  const MAX_COOKIE_BANNER_SHADOW_ROOTS = 32;
  const MAX_COOKIE_BANNER_SHADOW_DEPTH = 4;
  const REJECTION_PHRASES = Object.freeze([
    Object.freeze(["reject all", 100]), Object.freeze(["reject all cookies", 100]),
    Object.freeze(["reject optional", 98]), Object.freeze(["reject optional cookies", 98]),
    Object.freeze(["reject non-essential cookies", 98]), Object.freeze(["reject non essential cookies", 98]),
    Object.freeze(["refuse all", 96]), Object.freeze(["refuse all cookies", 96]),
    Object.freeze(["decline all", 94]), Object.freeze(["decline all cookies", 94]),
    Object.freeze(["deny all", 92]), Object.freeze(["deny all cookies", 92]),
    Object.freeze(["do not accept", 90]), Object.freeze(["do not accept cookies", 90]),
    Object.freeze(["continue without accepting", 88]),
    Object.freeze(["only necessary", 86]), Object.freeze(["only necessary cookies", 86]),
    Object.freeze(["necessary only", 84]), Object.freeze(["necessary cookies only", 84]),
    Object.freeze(["essential only", 82]), Object.freeze(["essential cookies only", 82]),
    Object.freeze(["use necessary cookies only", 82]), Object.freeze(["decline", 70]),
    Object.freeze(["alle ablehnen", 100]), Object.freeze(["alles ablehnen", 100]),
    Object.freeze(["tout refuser", 100]), Object.freeze(["refuser tout", 98]),
    Object.freeze(["rechazar todo", 100]), Object.freeze(["rechazar todas", 98]),
    Object.freeze(["rifiuta tutto", 100]), Object.freeze(["rifiuta tutti", 98]),
    Object.freeze(["rejeitar tudo", 100]), Object.freeze(["recusar tudo", 98]),
    Object.freeze(["alles weigeren", 100]), Object.freeze(["alles afwijzen", 100]),
    Object.freeze(["nur notwendige", 86]), Object.freeze(["nur notwendige cookies", 86]),
    Object.freeze(["cookies necessaires uniquement", 86]), Object.freeze(["necessaires uniquement", 84]),
    Object.freeze(["solo cookies necesarias", 86]), Object.freeze(["solo necesarias", 84]),
    Object.freeze(["solo cookie necessari", 86]),
    Object.freeze(["apenas cookies necessarios", 86]),
    Object.freeze(["alleen noodzakelijke cookies", 86])
  ]);
  const AMBIGUOUS_OR_POSITIVE = /\b(?:accept|accept all|allow all|agree|consent|save|manage|preferences?|settings|customize|personalize|akzeptieren|zustimmen|einstellungen|accepter|autoriser|preferences|parametres|aceptar|permitir|preferencias|configuracion|accetta|consenti|preferenze|impostazioni|aceitar|configuracoes|accepteren|toestaan|voorkeuren|instellingen)\b/i;
  const CONSENT_CONTEXT_PATTERN = /\b(?:cookie|cookies|cookie policy|consent|privacy choices?|tracking technologies|personal data|data partners?|vendors?|cmp)\b/i;

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
    return descriptor && "value" in descriptor && !descriptor.get && !descriptor.set ? descriptor.value : null;
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
  const nativeDocumentBodyGetter = DocumentPrototype ? captureGetter(DocumentPrototype, "body") : null;
  const TreeWalkerCtor = captureData(globalThis, "TreeWalker");
  const TreeWalkerPrototype = typeof TreeWalkerCtor === "function" ? captureData(TreeWalkerCtor, "prototype") : null;
  const nativeTreeWalkerNextNode = TreeWalkerPrototype ? captureData(TreeWalkerPrototype, "nextNode") : null;
  const NodeCtor = captureData(globalThis, "Node");
  const NodePrototype = typeof NodeCtor === "function" ? captureData(NodeCtor, "prototype") : null;
  const nativeNodeValueGetter = NodePrototype ? captureGetter(NodePrototype, "nodeValue") : null;
  const nativeGetRootNode = NodePrototype ? captureData(NodePrototype, "getRootNode") : null;
  const nativeParentElementGetter = NodePrototype ? captureGetter(NodePrototype, "parentElement") : null;
  const nativeIsConnectedGetter = NodePrototype ? captureGetter(NodePrototype, "isConnected") : null;
  const ElementCtor = captureData(globalThis, "Element");
  const ElementPrototype = typeof ElementCtor === "function" ? captureData(ElementCtor, "prototype") : null;
  const nativeGetAttribute = ElementPrototype ? captureData(ElementPrototype, "getAttribute") : null;
  const nativeHasAttribute = ElementPrototype ? captureData(ElementPrototype, "hasAttribute") : null;
  const nativeTagNameGetter = ElementPrototype ? captureGetter(ElementPrototype, "tagName") : null;
  const nativeIdGetter = ElementPrototype ? captureGetter(ElementPrototype, "id") : null;
  const nativeClassNameGetter = ElementPrototype ? captureGetter(ElementPrototype, "className") : null;
  const nativeClosest = ElementPrototype ? captureData(ElementPrototype, "closest") : null;
  const nativeShadowRootGetter = ElementPrototype ? captureGetter(ElementPrototype, "shadowRoot") : null;
  const ShadowRootCtor = captureData(globalThis, "ShadowRoot");
  const ShadowRootPrototype = typeof ShadowRootCtor === "function" ? captureData(ShadowRootCtor, "prototype") : null;
  const nativeShadowGetElementById = ShadowRootPrototype ? captureData(ShadowRootPrototype, "getElementById") : null;
  const HTMLInputElementCtor = captureData(globalThis, "HTMLInputElement");
  const HTMLInputElementPrototype = typeof HTMLInputElementCtor === "function" ? captureData(HTMLInputElementCtor, "prototype") : null;
  const nativeInputValueGetter = HTMLInputElementPrototype ? captureGetter(HTMLInputElementPrototype, "value") : null;
  const nativeInputTypeGetter = HTMLInputElementPrototype ? captureGetter(HTMLInputElementPrototype, "type") : null;
  const nativeInputDisabledGetter = HTMLInputElementPrototype ? captureGetter(HTMLInputElementPrototype, "disabled") : null;
  const HTMLButtonElementCtor = captureData(globalThis, "HTMLButtonElement");
  const HTMLButtonElementPrototype = typeof HTMLButtonElementCtor === "function" ? captureData(HTMLButtonElementCtor, "prototype") : null;
  const nativeButtonTypeGetter = HTMLButtonElementPrototype ? captureGetter(HTMLButtonElementPrototype, "type") : null;
  const nativeButtonDisabledGetter = HTMLButtonElementPrototype ? captureGetter(HTMLButtonElementPrototype, "disabled") : null;
  const nativeButtonFormGetter = HTMLButtonElementPrototype ? captureGetter(HTMLButtonElementPrototype, "form") : null;
  const NodeFilterObject = captureData(globalThis, "NodeFilter");
  const SHOW_TEXT = captureData(NodeFilterObject, "SHOW_TEXT");
  const SHOW_ELEMENT = captureData(NodeFilterObject, "SHOW_ELEMENT");

  if (typeof nativeCreateTreeWalker !== "function" || typeof nativeDocumentGetElementById !== "function"
    || typeof nativeDocumentElementGetter !== "function" || typeof nativeDocumentBodyGetter !== "function"
    || typeof nativeTreeWalkerNextNode !== "function" || typeof nativeNodeValueGetter !== "function"
    || typeof nativeGetRootNode !== "function" || typeof nativeParentElementGetter !== "function"
    || typeof nativeIsConnectedGetter !== "function" || typeof nativeGetAttribute !== "function"
    || typeof nativeHasAttribute !== "function" || typeof nativeTagNameGetter !== "function"
    || typeof nativeIdGetter !== "function" || typeof nativeClassNameGetter !== "function"
    || typeof nativeClosest !== "function" || typeof nativeShadowRootGetter !== "function"
    || typeof nativeShadowGetElementById !== "function" || typeof nativeInputValueGetter !== "function"
    || typeof nativeInputTypeGetter !== "function" || typeof nativeInputDisabledGetter !== "function"
    || typeof nativeButtonTypeGetter !== "function" || typeof nativeButtonDisabledGetter !== "function"
    || typeof nativeButtonFormGetter !== "function" || !Number.isSafeInteger(SHOW_TEXT) || !Number.isSafeInteger(SHOW_ELEMENT)) return;

  function createTreeWalker(root, whatToShow) {
    try { return Reflect.apply(nativeCreateTreeWalker, document, [root, whatToShow]); }
    catch { return null; }
  }

  function walkerNextNode(walker) {
    try { return Reflect.apply(nativeTreeWalkerNextNode, walker, []); }
    catch { return null; }
  }

  function nodeValue(node) {
    try {
      const value = Reflect.apply(nativeNodeValueGetter, node, []);
      return typeof value === "string" ? value : "";
    } catch { return ""; }
  }

  function nodeRoot(node) {
    try { return Reflect.apply(nativeGetRootNode, node, []); }
    catch { return null; }
  }

  function parentElement(node) {
    try { return Reflect.apply(nativeParentElementGetter, node, []) ?? null; }
    catch { return null; }
  }

  function nodeConnected(node) {
    try { return Reflect.apply(nativeIsConnectedGetter, node, []) === true; }
    catch { return false; }
  }

  function elementAttribute(element, name) {
    try {
      const value = Reflect.apply(nativeGetAttribute, element, [name]);
      return value === null || typeof value === "string" ? value : null;
    } catch { return null; }
  }

  function elementHasAttribute(element, name) {
    try { return Reflect.apply(nativeHasAttribute, element, [name]) === true; }
    catch { return true; }
  }

  function elementTagName(element) {
    try {
      const value = Reflect.apply(nativeTagNameGetter, element, []);
      return typeof value === "string" ? value.toLowerCase() : "";
    } catch { return ""; }
  }

  function elementId(element) {
    try {
      const value = Reflect.apply(nativeIdGetter, element, []);
      return typeof value === "string" ? value : "";
    } catch { return ""; }
  }

  function elementClassName(element) {
    try {
      const value = Reflect.apply(nativeClassNameGetter, element, []);
      return typeof value === "string" ? value : "";
    } catch { return ""; }
  }

  function documentElement() {
    try { return Reflect.apply(nativeDocumentElementGetter, document, []) ?? null; }
    catch { return null; }
  }

  function documentBody() {
    try { return Reflect.apply(nativeDocumentBodyGetter, document, []) ?? null; }
    catch { return null; }
  }

  function rootElementById(root, id) {
    try {
      if (root === document) return Reflect.apply(nativeDocumentGetElementById, document, [id]);
      return Reflect.apply(nativeShadowGetElementById, root, [id]);
    } catch { return null; }
  }

  function inputValue(element) {
    try {
      const value = Reflect.apply(nativeInputValueGetter, element, []);
      return typeof value === "string" ? value : "";
    } catch { return ""; }
  }

  function inputType(element) {
    try {
      const value = Reflect.apply(nativeInputTypeGetter, element, []);
      return typeof value === "string" ? value.toLowerCase() : "";
    } catch { return ""; }
  }

  function inputDisabled(element) {
    try { return Reflect.apply(nativeInputDisabledGetter, element, []) === true; }
    catch { return true; }
  }

  function buttonType(element) {
    try {
      const value = Reflect.apply(nativeButtonTypeGetter, element, []);
      return typeof value === "string" ? value.toLowerCase() : "";
    } catch { return ""; }
  }

  function buttonDisabled(element) {
    try { return Reflect.apply(nativeButtonDisabledGetter, element, []) === true; }
    catch { return true; }
  }

  function buttonHasForm(element) {
    try { return Boolean(Reflect.apply(nativeButtonFormGetter, element, [])); }
    catch { return true; }
  }

  function openShadowRoot(element) {
    try { return Reflect.apply(nativeShadowRootGetter, element, []) ?? null; }
    catch { return null; }
  }

  function normalizeBoundedText(value, maxRawChars, maxOutputChars) {
    if (typeof value !== "string" || !value) return "";
    return value.slice(0, maxRawChars).replace(/\s+/g, " ").trim().slice(0, maxOutputChars);
  }

  function boundedDescendantText(element, maxNodes = MAX_ACTION_TEXT_NODES, maxRawChars = MAX_ACTION_RAW_CHARS) {
    const walker = createTreeWalker(element, SHOW_TEXT);
    if (!walker) return "";
    let raw = "";
    let visited = 0;
    while (visited < maxNodes && raw.length < maxRawChars) {
      const node = walkerNextNode(walker);
      if (!node) break;
      visited += 1;
      const value = nodeValue(node);
      if (!value) continue;
      const remaining = maxRawChars - raw.length;
      raw += `${value.slice(0, remaining)} `;
    }
    return normalizeBoundedText(raw, maxRawChars, MAX_COOKIE_BANNER_TEXT_CHARS);
  }

  function labelReferenceSafe(target) {
    try {
      if (!nodeConnected(target) || isDropAdsOwned(target)) return false;
      const tag = elementTagName(target);
      if (["a", "area", "button", "input", "select", "textarea"].includes(tag)) return false;
      const role = elementAttribute(target, "role");
      return role !== "button" && role !== "link";
    } catch { return false; }
  }

  function labelledBySnapshot(element) {
    const rawIds = elementAttribute(element, "aria-labelledby") || "";
    const root = nodeRoot(element);
    if (!rawIds || rawIds.length > MAX_ARIA_LABELLEDBY_ATTR_CHARS || !root) return "";
    const ids = rawIds.trim().split(/\s+/).filter(Boolean);
    if (!ids.length || ids.length > MAX_ARIA_LABELLEDBY_IDS || new Set(ids).size !== ids.length) return "";
    const parts = [];
    for (const id of ids) {
      if (id.length > 128) return "";
      const target = rootElementById(root, id);
      const targetRoot = target ? nodeRoot(target) : null;
      if (!target || target === element || targetRoot !== root || !labelReferenceSafe(target)) return "";
      const part = boundedDescendantText(target, MAX_ARIA_REFERENCE_TEXT_NODES, MAX_ARIA_REFERENCE_RAW_CHARS);
      if (!part) return "";
      parts.push(part);
    }
    return normalizeBoundedText(parts.join(" "), MAX_ACTION_RAW_CHARS, MAX_COOKIE_BANNER_TEXT_CHARS);
  }

  function textSnapshot(element) {
    try {
      if (elementTagName(element) === "input") {
        const direct = normalizeBoundedText(inputValue(element) || elementAttribute(element, "aria-label") || "", MAX_ACTION_RAW_CHARS, MAX_COOKIE_BANNER_TEXT_CHARS);
        if (direct) return direct;
      } else {
        const ariaLabel = normalizeBoundedText(elementAttribute(element, "aria-label") || "", MAX_ACTION_RAW_CHARS, MAX_COOKIE_BANNER_TEXT_CHARS);
        if (ariaLabel) return ariaLabel;
      }
    } catch { return ""; }
    const descendant = boundedDescendantText(element);
    return descendant || labelledBySnapshot(element);
  }

  function normalizedActionText(value) {
    if (typeof value !== "string" || !value || value.length > MAX_COOKIE_BANNER_TEXT_CHARS) return "";
    let folded;
    try { folded = value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); }
    catch { return ""; }
    return folded.replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function rejectionScore(value) {
    const text = normalizedActionText(value);
    if (!text || AMBIGUOUS_OR_POSITIVE.test(text)) return 0;
    for (const [phrase, score] of REJECTION_PHRASES) if (text === phrase) return score;
    return 0;
  }

  function isDropAdsOwned(element) {
    try { return Boolean(Reflect.apply(nativeClosest, element, ['[data-drop-ads-extension], [data-drop-ads-picker-host]'])); }
    catch { return true; }
  }

  function isNavigationLike(element) {
    try {
      const tag = elementTagName(element);
      if (tag === "a" || tag === "area") return true;
      if (elementHasAttribute(element, "href") || elementHasAttribute(element, "formaction")) return true;
      if (tag === "button") return buttonType(element) === "submit" && buttonHasForm(element);
      if (tag === "input") return inputType(element) === "submit";
      return false;
    } catch { return true; }
  }

  function isButtonLike(element) {
    try {
      if (isNavigationLike(element)) return false;
      const tag = elementTagName(element);
      if (tag === "button") return !buttonDisabled(element);
      if (tag === "input") return !inputDisabled(element) && inputType(element) === "button";
      return elementAttribute(element, "role") === "button" && elementAttribute(element, "aria-disabled") !== "true";
    } catch { return false; }
  }

  function boundedConsentContext(element) {
    if (!element) return "";
    const parts = []; let total = 0;
    const append = (value) => {
      if (typeof value !== "string" || !value || total >= MAX_CONSENT_CONTEXT_CHARS) return;
      const normalized = value.slice(0, MAX_CONSENT_RAW_FIELD_CHARS).replace(/\s+/g, " ").trim();
      if (!normalized) return;
      const chunk = normalized.slice(0, MAX_CONSENT_CONTEXT_CHARS - total);
      if (!chunk) return;
      parts.push(chunk); total += chunk.length;
    };
    try {
      append(elementAttribute(element, "aria-label")); append(elementAttribute(element, "title")); append(elementId(element));
      append(elementClassName(element));
    } catch { return ""; }
    const walker = createTreeWalker(element, SHOW_TEXT);
    if (!walker) return parts.join(" ");
    let visited = 0;
    while (visited < MAX_CONSENT_TEXT_NODES && total < MAX_CONSENT_CONTEXT_CHARS) {
      const node = walkerNextNode(walker);
      if (!node) break;
      visited += 1; append(nodeValue(node));
    }
    return parts.join(" ");
  }

  function createConsentContextBudget() { return { cache: new Map(), evaluations: 0 }; }
  function consentContextFor(element, budget) {
    if (!budget) return boundedConsentContext(element);
    if (budget.cache.has(element)) return budget.cache.get(element);
    if (budget.evaluations >= MAX_CONSENT_CONTEXT_EVALUATIONS) return null;
    budget.evaluations += 1;
    const context = boundedConsentContext(element);
    if (budget.cache.size < MAX_CONSENT_CONTEXT_EVALUATIONS) budget.cache.set(element, context);
    return context;
  }

  function findConsentContainer(element, budget = null) {
    let current = element; let steps = 0;
    while (current && steps < MAX_CONSENT_ANCESTOR_STEPS) {
      const body = documentBody();
      const root = documentElement();
      if (!root || current === body || current === root) return null;
      const context = consentContextFor(current, budget);
      if (context === null) return null;
      if (context && CONSENT_CONTEXT_PATTERN.test(context)) return current;
      current = parentElement(current);
      steps += 1;
    }
    return null;
  }

  function discoverActionCandidates(root = null) {
    const scanRoot = root || documentElement();
    if (!scanRoot) return Object.freeze([]);
    const candidates = []; const rootQueue = [{ root: scanRoot, depth: 0 }]; const seenRoots = new Set([scanRoot]);
    const consentBudget = createConsentContextBudget(); let visited = 0; let shadowRoots = 0;
    while (rootQueue.length > 0 && visited < MAX_COOKIE_BANNER_SCAN_NODES && candidates.length < MAX_COOKIE_BANNER_CANDIDATES) {
      const current = rootQueue.shift();
      const walker = createTreeWalker(current.root, SHOW_ELEMENT);
      if (!walker) continue;
      let node = current.root;
      while (node && visited < MAX_COOKIE_BANNER_SCAN_NODES && candidates.length < MAX_COOKIE_BANNER_CANDIDATES) {
        visited += 1;
        if (isButtonLike(node) && !isDropAdsOwned(node)) {
          const text = textSnapshot(node); const consentRoot = text ? findConsentContainer(node, consentBudget) : null;
          if (text && consentRoot) candidates.push(Object.freeze({ element: node, text, consentRoot }));
        }
        if (current.depth < MAX_COOKIE_BANNER_SHADOW_DEPTH && shadowRoots < MAX_COOKIE_BANNER_SHADOW_ROOTS) {
          const shadowRoot = openShadowRoot(node);
          if (shadowRoot && !seenRoots.has(shadowRoot)) { seenRoots.add(shadowRoot); shadowRoots += 1; rootQueue.push({ root: shadowRoot, depth: current.depth + 1 }); }
        }
        node = walkerNextNode(walker);
      }
    }
    return Object.freeze(candidates);
  }

  function snapshotCandidate(candidate) {
    if (!candidate || typeof candidate !== "object") return null;
    let prototype; let keys;
    try { prototype = Object.getPrototypeOf(candidate); keys = Reflect.ownKeys(candidate); } catch { return null; }
    if (prototype !== Object.prototype && prototype !== null) return null;
    if (keys.length !== 3 || keys.some((key) => typeof key !== "string" || !["element", "text", "consentRoot"].includes(key))) return null;
    const values = Object.create(null);
    for (const key of ["element", "text", "consentRoot"]) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(candidate, key); } catch { return null; }
      if (!descriptor?.enumerable || !("value" in descriptor)) return null;
      values[key] = descriptor.value;
    }
    if (typeof values.text !== "string" || !values.text || values.text.length > MAX_COOKIE_BANNER_TEXT_CHARS) return null;
    if (!values.element || typeof values.element !== "object" || !values.consentRoot || typeof values.consentRoot !== "object") return null;
    return Object.freeze({ element: values.element, text: values.text, consentRoot: values.consentRoot });
  }

  function snapshotCandidateArray(candidates) {
    let isArray; let prototype; let ownKeys; let lengthDescriptor;
    try { isArray = Array.isArray(candidates); prototype = Object.getPrototypeOf(candidates); ownKeys = Reflect.ownKeys(candidates); lengthDescriptor = Object.getOwnPropertyDescriptor(candidates, "length"); }
    catch { return null; }
    if (!isArray || prototype !== Array.prototype) return null;
    if (!("value" in (lengthDescriptor ?? {})) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0 || lengthDescriptor.value > MAX_COOKIE_BANNER_CANDIDATES) return null;
    const length = lengthDescriptor.value;
    if (ownKeys.length !== length + 1) return null;
    const snapshots = new Array(length);
    for (let index = 0; index < length; index += 1) {
      const key = String(index);
      if (!ownKeys.includes(key)) return null;
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(candidates, key); } catch { return null; }
      if (!descriptor?.enumerable || !("value" in descriptor)) return null;
      const snapshot = snapshotCandidate(descriptor.value);
      if (!snapshot) return null;
      snapshots[index] = snapshot;
    }
    if (ownKeys.some((key) => key !== "length" && !/^(?:0|[1-9]\d*)$/.test(String(key)))) return null;
    return snapshots;
  }

  function selectRejectionCandidate(candidates) {
    const snapshots = snapshotCandidateArray(candidates);
    if (!snapshots) return null;
    let best = null; let bestScore = 0;
    for (const candidate of snapshots) { const score = rejectionScore(candidate.text); if (score > bestScore) { best = candidate; bestScore = score; } }
    return best;
  }

  const api = Object.freeze({
    MAX_COOKIE_BANNER_SCAN_NODES, MAX_COOKIE_BANNER_CANDIDATES, MAX_COOKIE_BANNER_TEXT_CHARS,
    MAX_ACTION_TEXT_NODES, MAX_ACTION_RAW_CHARS, MAX_ARIA_LABELLEDBY_IDS, MAX_ARIA_LABELLEDBY_ATTR_CHARS,
    MAX_ARIA_REFERENCE_TEXT_NODES, MAX_ARIA_REFERENCE_RAW_CHARS,
    MAX_CONSENT_ANCESTOR_STEPS, MAX_CONSENT_TEXT_NODES, MAX_CONSENT_CONTEXT_CHARS, MAX_CONSENT_RAW_FIELD_CHARS,
    MAX_CONSENT_CONTEXT_EVALUATIONS, MAX_COOKIE_BANNER_SHADOW_ROOTS, MAX_COOKIE_BANNER_SHADOW_DEPTH,
    textSnapshot, labelledBySnapshot, normalizedActionText, rejectionScore, isDropAdsOwned, isNavigationLike, isButtonLike,
    boundedConsentContext, findConsentContainer, discoverActionCandidates, snapshotCandidate, snapshotCandidateArray, selectRejectionCandidate
  });
  let existing;
  try { existing = Object.getOwnPropertyDescriptor(globalThis, UTILS_GLOBAL); }
  catch { return; }
  if (existing) return;
  try {
    Object.defineProperty(globalThis, UTILS_GLOBAL, {
      value: api,
      enumerable: false,
      writable: false,
      configurable: false
    });
  } catch {
    // Fail closed: composition will not initialize without the exact base utility global.
  }
})();
