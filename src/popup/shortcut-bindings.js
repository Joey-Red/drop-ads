import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";

const MAX_POPUP_SHORTCUTS = 16;
const SAFE_CONTROL_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function assertShortcutCatalog(shortcuts) {
  if (!Array.isArray(shortcuts) || shortcuts.length === 0 || shortcuts.length > MAX_POPUP_SHORTCUTS) {
    throw new Error("popup shortcut catalog is invalid");
  }
}

export function bindPopupShortcutControls(documentLike, shortcuts = POPUP_SHORTCUTS) {
  if (!documentLike || typeof documentLike.getElementById !== "function") {
    throw new Error("popup shortcut document boundary is unavailable");
  }
  assertShortcutCatalog(shortcuts);

  const controls = Object.create(null);
  const keys = new Set();
  const controlIds = new Set();

  for (const entry of shortcuts) {
    const key = entry?.key;
    const controlId = entry?.controlId;
    if (typeof key !== "string" || key.length !== 1 || key !== key.toLowerCase()) {
      throw new Error("popup shortcut key is invalid");
    }
    if (typeof controlId !== "string" || !SAFE_CONTROL_ID.test(controlId)) {
      throw new Error("popup shortcut control id is invalid");
    }
    if (keys.has(key) || controlIds.has(controlId)) {
      throw new Error("popup shortcut catalog contains duplicate routing");
    }

    const control = documentLike.getElementById(controlId);
    if (!control || control.id !== controlId) {
      throw new Error(`popup shortcut control is unavailable: ${controlId}`);
    }

    keys.add(key);
    controlIds.add(controlId);
    controls[key] = control;
  }

  return Object.freeze(controls);
}

export function bindPopupShortcutHelpItems(documentLike, shortcuts = POPUP_SHORTCUTS) {
  if (!documentLike || typeof documentLike.querySelectorAll !== "function") {
    throw new Error("popup shortcut help document boundary is unavailable");
  }
  assertShortcutCatalog(shortcuts);

  const candidates = [...documentLike.querySelectorAll("[data-shortcut]")];
  if (candidates.length !== shortcuts.length) throw new Error("popup shortcut help row count is invalid");

  const byKey = new Map();
  for (const row of candidates) {
    const key = row?.dataset?.shortcut;
    if (typeof key !== "string" || byKey.has(key)) throw new Error("popup shortcut help key is invalid");
    byKey.set(key, row);
  }

  const rows = [];
  for (const entry of shortcuts) {
    const row = byKey.get(entry.key);
    if (!row) throw new Error(`popup shortcut help row is missing: ${entry.key}`);
    if (row.dataset.shortcutControl !== entry.controlId) throw new Error("popup shortcut help control binding is invalid");
    const keycap = row.querySelector?.("kbd")?.textContent?.trim();
    const help = row.querySelector?.("span:not(.shortcut-availability)")?.textContent?.trim();
    if (keycap !== entry.shortcut || help !== entry.help) throw new Error("popup shortcut help copy is invalid");
    if (row.hasAttribute?.("data-site-shortcut") !== entry.siteOnly) throw new Error("popup shortcut help scope is invalid");
    rows.push(row);
  }

  return Object.freeze(rows);
}
