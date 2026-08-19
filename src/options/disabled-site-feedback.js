const section = document.querySelector("#disabled-sites-settings");
const list = document.querySelector("#disabled-sites");
const help = document.querySelector("#disabled-sites-help") ?? section?.querySelector(":scope > .hint");
const legacyError = document.querySelector("#allow-error");
let listObserver = null;
let errorObserver = null;
let pendingRecovery = false;
let pageActive = true;

const status = document.createElement("p");
status.id = "disabled-sites-status";
status.className = "hint";
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
status.setAttribute("aria-atomic", "true");
if (list?.parentElement) list.before(status);

function bindActions() {
  if (!list) return;
  for (const action of list.querySelectorAll("li:not(.empty) button.remove")) {
    const tokens = new Set((action.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    if (help?.id) tokens.add(help.id);
    tokens.add(status.id);
    action.setAttribute("aria-describedby", [...tokens].join(" "));
  }
}

function handleClick(event) {
  const action = event.target?.closest?.("button.remove");
  if (!action || !list?.contains(action)) return;
  pendingRecovery = true;
  status.textContent = "Re-enabling site protection…";
}

function handleListMutation() {
  bindActions();
  if (!pageActive || !pendingRecovery) return;
  pendingRecovery = false;
  status.textContent = "Site protection re-enabled.";
}

function transferPendingFailure() {
  if (!pageActive || !pendingRecovery || !legacyError?.textContent) return;
  status.textContent = legacyError.textContent;
  legacyError.textContent = "";
  pendingRecovery = false;
}

bindActions();
if (list && typeof globalThis.MutationObserver === "function") {
  list.addEventListener("click", handleClick, true);
  listObserver = new globalThis.MutationObserver(handleListMutation);
  listObserver.observe(list, { childList: true, subtree: true });
}
if (legacyError && typeof globalThis.MutationObserver === "function") {
  errorObserver = new globalThis.MutationObserver(transferPendingFailure);
  errorObserver.observe(legacyError, { childList: true, characterData: true, subtree: true });
}

window.addEventListener("pagehide", () => {
  pageActive = false;
  pendingRecovery = false;
  list?.removeEventListener("click", handleClick, true);
  try { listObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  listObserver = null;
  try { errorObserver?.disconnect(); } catch { /* Best-effort UI teardown. */ }
  errorObserver = null;
}, { once: true });
