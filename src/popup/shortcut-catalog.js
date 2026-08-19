const RAW_POPUP_SHORTCUTS = [
  { key: "g", shortcut: "G", controlId: "enabled", help: "Toggle global blocking", siteOnly: false },
  { key: "s", shortcut: "S", controlId: "site-enabled", help: "Toggle protection on this site", siteOnly: true },
  { key: "p", shortcut: "P", controlId: "pause-site", help: "Pause or resume this site for the session", siteOnly: true },
  { key: "c", shortcut: "C", controlId: "cookie-site-enabled", help: "Toggle cookie protection on this site", siteOnly: true },
  { key: "b", shortcut: "B", controlId: "cookie-banner-site-enabled", help: "Toggle cookie-banner rejection on this site", siteOnly: true },
  { key: "e", shortcut: "E", controlId: "pick-element", help: "Start the element picker", siteOnly: true },
  { key: "o", shortcut: "O", controlId: "settings", help: "Open Settings", siteOnly: false }
];

function freezeShortcut(entry) {
  return Object.freeze({
    key: entry.key,
    shortcut: entry.shortcut,
    controlId: entry.controlId,
    help: entry.help,
    siteOnly: entry.siteOnly
  });
}

export const POPUP_SHORTCUTS = Object.freeze(RAW_POPUP_SHORTCUTS.map(freezeShortcut));
export const POPUP_SHORTCUT_KEYS = Object.freeze(POPUP_SHORTCUTS.map((entry) => entry.key));
