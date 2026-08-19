export function popupShortcutControlAvailable(control, { pageActive = true, popupMain = null } = {}) {
  if (!pageActive || !control?.isConnected || control.disabled || control.hidden === true) return false;
  if (popupMain?.getAttribute?.("aria-busy") === "true") return false;
  if (control.getAttribute?.("aria-busy") === "true") return false;
  if (control.closest?.("[hidden]")) return false;
  const busyAncestor = control.closest?.('[aria-busy="true"]');
  if (busyAncestor && busyAncestor !== popupMain) return false;
  return true;
}
