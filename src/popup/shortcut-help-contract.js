import { POPUP_SHORTCUTS } from "./shortcut-catalog.js";

function rowText(row, selector) {
  return row?.querySelector?.(selector)?.textContent?.trim() ?? "";
}

export function bindPopupShortcutHelp(root) {
  if (!root?.querySelectorAll) return null;
  const rows = [...root.querySelectorAll("[data-shortcut]")];
  if (rows.length !== POPUP_SHORTCUTS.length) return null;

  const byKey = new Map();
  for (const row of rows) {
    const key = row?.dataset?.shortcut ?? "";
    if (!key || byKey.has(key)) return null;
    byKey.set(key, row);
  }

  const ordered = [];
  for (const definition of POPUP_SHORTCUTS) {
    const row = byKey.get(definition.key);
    if (!row) return null;
    if (row.dataset?.shortcutControl !== definition.controlId) return null;
    if (rowText(row, "kbd") !== definition.shortcut) return null;
    if (rowText(row, "span:not(.shortcut-availability)") !== definition.help) return null;
    if (row.hasAttribute?.("data-site-shortcut") !== definition.siteOnly) return null;
    ordered.push(row);
  }

  return Object.freeze(ordered);
}
