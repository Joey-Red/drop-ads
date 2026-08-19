const siteSection = document.querySelector("#site-section");
const siteControls = [
  document.querySelector("#site-enabled"),
  document.querySelector("#cookie-site-enabled"),
  document.querySelector("#pause-site"),
  document.querySelector("#pick-element")
].filter(Boolean);

let observer = null;

function syncSiteSectionBusy() {
  if (!siteSection) return;
  const busy = siteControls.some((control) => control.getAttribute("aria-busy") === "true");
  const next = busy ? "true" : "false";
  if (siteSection.getAttribute("aria-busy") !== next) siteSection.setAttribute("aria-busy", next);
}

syncSiteSectionBusy();
if (siteSection && siteControls.length && typeof globalThis.MutationObserver === "function") {
  observer = new globalThis.MutationObserver(syncSiteSectionBusy);
  for (const control of siteControls) observer.observe(control, { attributes: true, attributeFilter: ["aria-busy"] });
}

window.addEventListener("pagehide", () => {
  try { observer?.disconnect(); } catch { /* Best-effort popup teardown. */ }
  observer = null;
}, { once: true });
