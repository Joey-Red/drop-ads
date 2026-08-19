(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const messageContract = globalThis.DropAdsContentMessageContract;
  if (!messageContract) return;
  let styleNode = null;
  let attachObserver = null;
  let refreshQueued = false;
  let refreshGeneration = 0;

  function bestEffortDisconnect(observer) {
    if (!observer) return;
    try {
      const disconnect = observer.disconnect;
      if (typeof disconnect === "function") Reflect.apply(disconnect, observer, []);
    } catch { /* observer cleanup must not escape */ }
  }

  function styleConnected(node) {
    try { return node?.isConnected === true; }
    catch { return false; }
  }

  function bestEffortRemoveStyleNode(node) {
    if (!node) return;
    try { node.textContent = ""; } catch { /* neutralization is best effort */ }
    try {
      const remove = node.remove;
      if (typeof remove === "function") {
        Reflect.apply(remove, node, []);
        return;
      }
    } catch { /* fall through to parent removal */ }
    try {
      const parent = node.parentNode;
      const removeChild = parent?.removeChild;
      if (typeof removeChild === "function") Reflect.apply(removeChild, parent, [node]);
    } catch { /* DOM cleanup must not escape stale-policy recovery */ }
  }

  function appendStyleNode(node, documentRef = document) {
    if (!node || styleConnected(node)) return styleConnected(node);
    let parent;
    let append;
    try {
      parent = documentRef?.documentElement ?? documentRef?.head ?? null;
      append = parent?.append;
    } catch {
      return false;
    }
    if (!parent || typeof append !== "function") return false;
    try {
      Reflect.apply(append, parent, [node]);
      return styleConnected(node);
    } catch {
      return false;
    }
  }

  function stopAttachObserver(expectedObserver = null) {
    const observer = attachObserver;
    if (expectedObserver && observer !== expectedObserver) return false;
    attachObserver = null;
    bestEffortDisconnect(observer);
    return Boolean(observer);
  }

  function removeStyle() {
    stopAttachObserver();
    const node = styleNode;
    styleNode = null;
    bestEffortRemoveStyleNode(node);
  }

  function attachStyle() {
    const node = styleNode;
    if (!node || styleConnected(node)) return;
    appendStyleNode(node, document);
  }

  function ensureStyle(stylesheet) {
    if (!stylesheet) {
      removeStyle();
      return;
    }
    if (!styleNode) {
      styleNode = document.createElement("style");
      styleNode.setAttribute("data-drop-ads-extension", "cosmetic");
    }
    if (styleNode.textContent !== stylesheet) styleNode.textContent = stylesheet;
    attachStyle();
    if (!styleConnected(styleNode) && !attachObserver) {
      let observer = null;
      observer = new MutationObserver(() => {
        if (attachObserver !== observer) return;
        try {
          attachStyle();
          if (styleNode && styleConnected(styleNode)) stopAttachObserver(observer);
        } catch {
          if (attachObserver === observer) removeStyle();
        }
      });
      attachObserver = observer;
      observer.observe(document, { childList: true, subtree: true });
    }
  }

  async function refresh() {
    const generation = ++refreshGeneration;
    try {
      const response = messageContract.snapshotCosmeticPolicyResponse(
        await api.runtime.sendMessage({ type: "drop-ads:get-cosmetic-policy" })
      );
      if (generation !== refreshGeneration) return;
      if (!response?.ok || !response.policy.enabled) {
        removeStyle();
        return;
      }
      ensureStyle(response.policy.stylesheet);
    } catch {
      if (generation !== refreshGeneration) return;
      // A missing/restarting background must never leave stale cosmetic policy applied.
      removeStyle();
    }
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    try {
      queueMicrotask(() => {
        refreshQueued = false;
        void refresh();
      });
    } catch {
      refreshQueued = false;
      void refresh();
    }
  }

  globalThis.DropAdsCosmeticLifecycle = Object.freeze({
    bestEffortDisconnect,
    bestEffortRemoveStyleNode,
    styleConnected,
    appendStyleNode,
    stopAttachObserver,
    removeStyle,
    ensureStyle,
    refresh,
    queueRefresh
  });

  api.runtime.onMessage.addListener((message) => {
    if (!messageContract.accepts(message, "drop-ads:cosmetic-refresh")) return false;
    queueRefresh();
    return false;
  });

  void refresh();
})();
