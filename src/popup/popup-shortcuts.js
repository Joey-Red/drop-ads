const definitions = [
  { key: "G", route: "g", selector: "#enabled", siteOnly: false },
  { key: "S", route: "s", selector: "#site-enabled", siteOnly: true },
  { key: "C", route: "c", selector: "#cookie-site-enabled", siteOnly: true },
  { key: "P", route: "p", selector: "#pause-site", siteOnly: true },
  { key: "E", route: "e", selector: "#pick-element", siteOnly: true },
  { key: "O", route: "o", selector: "#settings", siteOnly: false }
].map((definition) => Object.freeze(definition));

export const POPUP_SHORTCUT_DEFINITIONS = Object.freeze(definitions);
export const POPUP_SITE_SHORTCUT_KEYS = Object.freeze(
  POPUP_SHORTCUT_DEFINITIONS.filter((definition) => definition.siteOnly).map((definition) => definition.key)
);

export function resolvePopupShortcutControls(root = document) {
  const controls = Object.create(null);
  for (const definition of POPUP_SHORTCUT_DEFINITIONS) {
    controls[definition.route] = root.querySelector(definition.selector);
  }
  return Object.freeze(controls);
}

export function shortcutDefinitionForKey(key) {
  const normalized = String(key ?? "").toUpperCase();
  return POPUP_SHORTCUT_DEFINITIONS.find((definition) => definition.key === normalized) ?? null;
}
