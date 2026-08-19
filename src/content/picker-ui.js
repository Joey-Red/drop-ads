(() => {
  function create(host) {
    if (!host || typeof host.attachShadow !== "function") throw new Error("Picker host is unavailable");
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; color-scheme: light dark; }
        #box { position: fixed; pointer-events: none; border: 3px solid CanvasText; background: color-mix(in srgb, CanvasText 8%, transparent); box-sizing: border-box; display: none; }
        #panel { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); width: min(620px, calc(100vw - 32px)); max-height: calc(100vh - 44px); overflow:auto; box-sizing: border-box; padding: 14px; border: 2px solid CanvasText; border-radius: 8px; background: Canvas; color: CanvasText; font: 17px/1.45 system-ui,sans-serif; box-shadow: 5px 5px 0 color-mix(in srgb, CanvasText 18%, transparent); pointer-events: auto; }
        #panel:focus { outline:3px solid CanvasText; outline-offset:2px; }
        #panel strong { display:block; font-size:18px; margin-bottom:5px; }
        #message { margin: 0 0 10px; }
        #privacy { margin:8px 0 0; font-size:14px; opacity:.78; }
        #candidate { display:none; margin:8px 0; padding:8px; overflow-wrap:anywhere; border:1px solid color-mix(in srgb, CanvasText 55%, transparent); border-radius:5px; font:15px/1.4 ui-monospace,monospace; }
        #actions { display:none; gap:8px; flex-wrap:wrap; }
        button { min-height:44px; padding:8px 12px; border:1px solid CanvasText; border-radius:6px; background:Canvas; color:CanvasText; font:inherit; cursor:pointer; }
        button:focus-visible { outline:3px solid CanvasText; outline-offset:2px; }
        button:disabled { cursor:default; opacity:.6; }
        @media (max-width: 420px) {
          #panel { bottom: 10px; width: calc(100vw - 20px); max-height: calc(100vh - 20px); padding: 12px; }
          #actions { flex-direction:column; }
          #actions button { width:100%; box-sizing:border-box; }
        }
        @media (prefers-contrast: more) {
          #box { border-width:4px; background:transparent; }
          #panel { border-width:3px; box-shadow:none; }
          #candidate, button { border-width:2px; }
          #privacy, button:disabled { opacity:1; }
        }
        @media (forced-colors: active) {
          #box, #panel, #candidate, button { border-color: CanvasText; }
          #box { background: transparent; }
          #panel, button { background: Canvas; color: CanvasText; box-shadow: none; }
          #privacy { opacity:1; }
          button:disabled { color:GrayText; opacity:1; }
          #panel:focus, button:focus-visible { outline-color: Highlight; }
        }
      </style>
      <div id="box" aria-hidden="true"></div>
      <div id="panel" role="dialog" tabindex="-1" aria-keyshortcuts="Escape" aria-labelledby="drop-ads-picker-title" aria-describedby="message privacy" aria-busy="false">
        <strong id="drop-ads-picker-title">Pick an element to hide</strong>
        <p id="message" role="status" aria-live="polite" aria-atomic="true">Point at an element and click it. Keyboard: Tab to an element, then Enter. Escape cancels.</p>
        <div id="candidate" role="region" aria-label="Selector preview"></div>
        <div id="actions" role="group" aria-label="Picker actions"><button id="save" type="button" aria-describedby="candidate message privacy">Hide on this site</button><button id="cancel" type="button" aria-keyshortcuts="Escape" aria-describedby="message privacy">Cancel</button></div>
        <p id="privacy">Local only. Drop Ads does not retain page contents, picked-element history, request history, statistics, or identifiers.</p>
      </div>`;

    const box = shadow.querySelector("#box");
    const panel = shadow.querySelector("#panel");
    const message = shadow.querySelector("#message");
    const candidate = shadow.querySelector("#candidate");
    const actions = shadow.querySelector("#actions");
    const save = shadow.querySelector("#save");
    const cancel = shadow.querySelector("#cancel");
    if (!box || !panel || !message || !candidate || !actions || !save || !cancel) {
      throw new Error("Picker UI is incomplete");
    }

    let wasBusy = false;
    function syncBusy() {
      const busy = save.disabled === true;
      panel.setAttribute("aria-busy", busy ? "true" : "false");
      if (wasBusy && !busy && host.isConnected === true) {
        try { save.focus(); } catch { /* failed-save focus recovery is best effort */ }
      }
      wasBusy = busy;
    }

    let busyObserver = null;
    syncBusy();
    if (typeof globalThis.MutationObserver === "function") {
      busyObserver = new globalThis.MutationObserver(syncBusy);
      busyObserver.observe(save, { attributes: true, attributeFilter: ["disabled"] });
    }

    try {
      queueMicrotask(() => {
        if (host.isConnected !== true) return;
        try { panel.focus(); } catch { /* initial picker focus is best effort */ }
      });
    } catch { /* picker remains usable if microtask scheduling is unavailable */ }

    return Object.freeze({
      shadow,
      box,
      panel,
      message,
      candidate,
      actions,
      save,
      cancel,
      dispose() {
        try { busyObserver?.disconnect(); } catch { /* best-effort picker UI teardown */ }
        busyObserver = null;
        wasBusy = false;
      }
    });
  }

  globalThis.DropAdsPickerUi = Object.freeze({ create });
})();
