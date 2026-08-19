const blockList = document.querySelector("#block-list");
const allowList = document.querySelector("#allow-list");
const observers = [];

function appendDescription(control, ...ids) {
  if (!control) return;
  const tokens = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  for (const id of ids) if (id) tokens.add(id);
  if (tokens.size) control.setAttribute("aria-describedby", [...tokens].join(" "));
}

function enhanceList(list, helpId, errorId, isBlock = false) {
  if (!list) return;
  for (const row of list.querySelectorAll("li[data-rule-key]")) {
    appendDescription(row.querySelector("button.remove"), helpId, errorId);
    if (!isBlock) continue;
    for (const action of row.querySelectorAll("button.secondary-action")) {
      const text = action.textContent?.trim();
      if (text === "Submit" || text === "Prepare submission") {
        appendDescription(action, "block-help", "community-help", "block-error");
      } else if (text === "Remove allow" || text === "Remove allow override") {
        appendDescription(action, "allow-help", "allow-error");
      }
    }
  }
}

function enhanceAll() {
  enhanceList(blockList, "block-help", "block-error", true);
  enhanceList(allowList, "allow-help", "allow-error");
}

enhanceAll();
if (typeof globalThis.MutationObserver === "function") {
  for (const list of [blockList, allowList]) {
    if (!list) continue;
    const observer = new globalThis.MutationObserver(enhanceAll);
    observer.observe(list, { childList: true, subtree: true });
    observers.push(observer);
  }
}

window.addEventListener("pagehide", () => {
  for (const observer of observers.splice(0)) {
    try { observer.disconnect(); } catch { /* Best-effort UI teardown. */ }
  }
}, { once: true });
