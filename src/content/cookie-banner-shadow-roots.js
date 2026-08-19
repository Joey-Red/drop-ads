(() => {
  const SHADOW_ROOTS_GLOBAL = "DropAdsCookieBannerShadowRoots";
  const MAX_SHADOW_SCAN_NODES = 2_000;
  const MAX_OPEN_SHADOW_ROOTS = 32;
  const MAX_OPEN_SHADOW_DEPTH = 4;
  const MAX_PLATFORM_PROTOTYPE_DEPTH = 8;

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
    return descriptor && typeof descriptor.get === "function" && !("value" in descriptor) ? descriptor.get : null;
  }

  const nativeCreateTreeWalker = captureData(document, "createTreeWalker");
  const TreeWalkerCtor = captureData(globalThis, "TreeWalker");
  const TreeWalkerPrototype = typeof TreeWalkerCtor === "function" ? captureData(TreeWalkerCtor, "prototype") : null;
  const nativeTreeWalkerNextNode = TreeWalkerPrototype ? captureData(TreeWalkerPrototype, "nextNode") : null;
  const ElementCtor = captureData(globalThis, "Element");
  const ElementPrototype = typeof ElementCtor === "function" ? captureData(ElementCtor, "prototype") : null;
  const nativeShadowRootGetter = ElementPrototype ? captureGetter(ElementPrototype, "shadowRoot") : null;
  const NodeFilterObject = captureData(globalThis, "NodeFilter");
  const SHOW_ELEMENT = captureData(NodeFilterObject, "SHOW_ELEMENT");
  if (typeof nativeCreateTreeWalker !== "function" || typeof nativeTreeWalkerNextNode !== "function"
    || typeof nativeShadowRootGetter !== "function" || !Number.isSafeInteger(SHOW_ELEMENT)) return;

  function createElementWalker(root) {
    try { return Reflect.apply(nativeCreateTreeWalker, document, [root, SHOW_ELEMENT]); }
    catch { return null; }
  }

  function nextWalkerNode(walker) {
    try { return Reflect.apply(nativeTreeWalkerNextNode, walker, []); }
    catch { return null; }
  }

  function openShadowRoot(element) {
    try { return Reflect.apply(nativeShadowRootGetter, element, []) ?? null; }
    catch { return null; }
  }

  function collectOpenShadowRoots(root = document.documentElement) {
    if (!root) return Object.freeze([]);
    const roots = [];
    const queue = [{ root, depth: 0 }];
    const seen = new Set([root]);
    let queueIndex = 0;
    let visited = 0;

    while (queueIndex < queue.length && visited < MAX_SHADOW_SCAN_NODES && roots.length < MAX_OPEN_SHADOW_ROOTS) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const walker = createElementWalker(current.root);
      if (!walker) continue;
      let node = current.root;
      while (node && visited < MAX_SHADOW_SCAN_NODES && roots.length < MAX_OPEN_SHADOW_ROOTS) {
        visited += 1;
        if (current.depth < MAX_OPEN_SHADOW_DEPTH) {
          const shadowRoot = openShadowRoot(node);
          if (shadowRoot && !seen.has(shadowRoot)) {
            seen.add(shadowRoot);
            roots.push(shadowRoot);
            queue.push({ root: shadowRoot, depth: current.depth + 1 });
          }
        }
        node = nextWalkerNode(walker);
      }
    }
    return Object.freeze(roots);
  }

  const api = Object.freeze({
    MAX_SHADOW_SCAN_NODES,
    MAX_OPEN_SHADOW_ROOTS,
    MAX_OPEN_SHADOW_DEPTH,
    collectOpenShadowRoots
  });
  let existing;
  try { existing = Object.getOwnPropertyDescriptor(globalThis, SHADOW_ROOTS_GLOBAL); }
  catch { return; }
  if (existing) return;
  try {
    Object.defineProperty(globalThis, SHADOW_ROOTS_GLOBAL, {
      value: api,
      enumerable: false,
      writable: false,
      configurable: false
    });
  } catch {
    // Fail closed: controller requires the exact frozen shadow-root API.
  }
})();
