const api = globalThis.browser ?? globalThis.chrome;
const settings = document.querySelector("#settings");
const globalStatus = document.querySelector("#global-status");

let opening = false;

async function openSettingsEarly(event) {
  if (!settings || opening) return;
  event?.stopImmediatePropagation?.();
  opening = true;
  settings.disabled = true;
  const previous = globalStatus?.textContent ?? "";
  if (globalStatus) globalStatus.textContent = "Opening Settings…";
  try {
    await Promise.resolve(api.runtime.openOptionsPage());
  } catch {
    if (globalStatus) globalStatus.textContent = "Could not open Settings. Reload the extension and try again.";
  } finally {
    opening = false;
    if (settings.isConnected) settings.disabled = false;
    if (globalStatus?.textContent === "Opening Settings…") globalStatus.textContent = previous;
  }
}

settings?.addEventListener("click", openSettingsEarly, { capture: true });

window.addEventListener("pagehide", () => {
  settings?.removeEventListener("click", openSettingsEarly, { capture: true });
}, { once: true });
