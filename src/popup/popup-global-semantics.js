import { GLOBAL_BLOCKING_OFF_STATUS, GLOBAL_BLOCKING_ON_STATUS, globalBlockingCommitStatus } from "../core/ui-commit-status.js";

const popupMain = document.querySelector("#popup-main");
const enabled = document.querySelector("#enabled");
const globalStatus = document.querySelector("#global-status");

let pageActive = true;
let observer = null;

function derivedGlobalStatusText() {
  return globalBlockingCommitStatus(Boolean(enabled?.checked));
}

function syncGlobalStatus() {
  if (!pageActive || !enabled || !globalStatus) return;
  if (popupMain?.getAttribute("aria-busy") === "true") return;

  const existing = globalStatus.textContent?.trim() ?? "";
  const ownsCurrentText = globalStatus.dataset.derivedGlobalStatus === "true"
    && (existing === GLOBAL_BLOCKING_ON_STATUS || existing === GLOBAL_BLOCKING_OFF_STATUS);
  if (globalStatus.dataset.derivedGlobalStatus === "true" && !ownsCurrentText) {
    delete globalStatus.dataset.derivedGlobalStatus;
  }

  if (existing && !ownsCurrentText) return;
  const next = derivedGlobalStatusText();
  if (existing !== next) globalStatus.textContent = next;
  globalStatus.dataset.derivedGlobalStatus = "true";
}

syncGlobalStatus();
enabled?.addEventListener("change", syncGlobalStatus);
if (globalStatus && typeof globalThis.MutationObserver === "function") {
  observer = new globalThis.MutationObserver(syncGlobalStatus);
  observer.observe(globalStatus, { childList: true, characterData: true, subtree: true });
  if (popupMain) observer.observe(popupMain, { attributes: true, attributeFilter: ["aria-busy"] });
}

window.addEventListener("pagehide", () => {
  pageActive = false;
  try { observer?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  observer = null;
  enabled?.removeEventListener("change", syncGlobalStatus);
}, { once: true });
