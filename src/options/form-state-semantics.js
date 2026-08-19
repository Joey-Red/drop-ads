import "./recovery-bootstrap.js";
import "./list-filter.js";

const nativeErrorBindings = [
  ["#block-error", ["#block-input"]],
  ["#allow-error", ["#allow-input"]],
  ["#subscription-error", ["#subscription-url"]],
  ["#cookie-exception-error", ["#cookie-exception-input"]],
  ["#cosmetic-hide-error", ["#cosmetic-hide-selector"]],
  ["#cosmetic-allow-error", ["#cosmetic-allow-selector"]]
];

const clearOnEditBindings = [
  ["#block-error", [["#block-input", "input"]]],
  ["#allow-error", [["#allow-input", "input"]]],
  ["#subscription-error", [["#subscription-url", "input"], ["#subscription-format", "change"]]],
  ["#cookie-exception-error", [["#cookie-exception-input", "input"]]],
  ["#cosmetic-hide-error", [["#cosmetic-hide-domain", "input"], ["#cosmetic-hide-selector", "input"]]],
  ["#cosmetic-allow-error", [["#cosmetic-allow-domain", "input"], ["#cosmetic-allow-selector", "input"]]],
  ["#backup-error", [["#import-settings-file", "change"]]]
];

const ownedObservers = [];
const ownedListeners = [];

function textContent(node) {
  return node?.textContent?.trim() ?? "";
}

function isNativelyInvalid(control) {
  try {
    return control?.willValidate === true && control?.validity?.valid === false;
  } catch {
    return false;
  }
}

function appendDescription(control, id) {
  if (!control || !id) return;
  const tokens = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  tokens.add(id);
  control.setAttribute("aria-describedby", [...tokens].join(" "));
}

function publishNativeErrorState(control, errorNode) {
  if (!control) return;
  const invalid = isNativelyInvalid(control);
  const hasMessage = textContent(errorNode).length > 0;
  if (invalid) {
    control.setAttribute("aria-invalid", "true");
    if (hasMessage) control.setAttribute("aria-errormessage", errorNode.id);
    else control.removeAttribute("aria-errormessage");
  } else {
    control.removeAttribute("aria-invalid");
    control.removeAttribute("aria-errormessage");
  }
}

function ownListener(control, eventName, listener) {
  if (!control) return;
  control.addEventListener(eventName, listener);
  ownedListeners.push([control, eventName, listener]);
}

function ownNativeErrorState(errorSelector, controlSelectors) {
  const errorNode = document.querySelector(errorSelector);
  const controls = controlSelectors.map((selector) => document.querySelector(selector)).filter(Boolean);
  if (!errorNode || !controls.length) return;

  const sync = () => {
    for (const control of controls) publishNativeErrorState(control, errorNode);
  };
  sync();
  for (const control of controls) {
    ownListener(control, "input", sync);
    ownListener(control, "change", sync);
    ownListener(control, "invalid", sync);
  }
  if (typeof globalThis.MutationObserver !== "function") return;

  const observer = new globalThis.MutationObserver(sync);
  observer.observe(errorNode, { childList: true, characterData: true, subtree: true });
  ownedObservers.push(observer);
}

function ownClearOnEdit(errorSelector, entries) {
  const errorNode = document.querySelector(errorSelector);
  if (!errorNode) return;
  const clear = () => {
    if (textContent(errorNode)) errorNode.textContent = "";
  };
  for (const [selector, eventName] of entries) ownListener(document.querySelector(selector), eventName, clear);
}

function ownCountrySourceState() {
  const form = document.querySelector("#country-form");
  const preset = document.querySelector("#country-preset");
  const custom = document.querySelector("#country-custom-tld");
  const submit = document.querySelector("#country-submit");
  if (!preset || !custom || !submit) return;

  const hasSource = () => Boolean(preset.value || custom.value.trim());
  const syncSubmit = () => {
    if (form?.getAttribute("aria-busy") === "true") return;
    submit.disabled = !hasSource();
  };
  const choosePreset = () => {
    if (preset.value) custom.value = "";
    syncSubmit();
  };
  const chooseCustom = () => {
    if (custom.value.trim()) preset.value = "";
    syncSubmit();
  };

  ownListener(preset, "change", choosePreset);
  ownListener(custom, "input", chooseCustom);
  syncSubmit();

  if (form && typeof globalThis.MutationObserver === "function") {
    const observer = new globalThis.MutationObserver(syncSubmit);
    observer.observe(form, { attributes: true, attributeFilter: ["aria-busy"] });
    ownedObservers.push(observer);
  }
}

function installCosmeticScopePreview(formSelector, domainSelector, statusId, controlSelectors) {
  const form = document.querySelector(formSelector);
  const domainInput = document.querySelector(domainSelector);
  const errorNode = form?.querySelector(".error");
  if (!form || !domainInput || !errorNode) return;

  let status = document.getElementById(statusId);
  if (!status) {
    status = document.createElement("p");
    status.id = statusId;
    status.className = "hint cosmetic-scope-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    errorNode.before(status);
  }

  const update = () => {
    status.textContent = domainInput.value.trim()
      ? "Scope: one site. The site value will be validated when the rule is added."
      : "Scope: all sites.";
  };

  update();
  ownListener(domainInput, "input", update);
  for (const selector of controlSelectors) appendDescription(document.querySelector(selector), statusId);
}

for (const [errorSelector, controlSelectors] of nativeErrorBindings) ownNativeErrorState(errorSelector, controlSelectors);
for (const [errorSelector, entries] of clearOnEditBindings) ownClearOnEdit(errorSelector, entries);
ownCountrySourceState();
installCosmeticScopePreview(
  "#cosmetic-hide-form",
  "#cosmetic-hide-domain",
  "cosmetic-hide-scope-status",
  ["#cosmetic-hide-domain", "#cosmetic-hide-selector", "#cosmetic-hide-form button[type=\"submit\"]"]
);
installCosmeticScopePreview(
  "#cosmetic-allow-form",
  "#cosmetic-allow-domain",
  "cosmetic-allow-scope-status",
  ["#cosmetic-allow-domain", "#cosmetic-allow-selector", "#cosmetic-allow-form button[type=\"submit\"]"]
);

window.addEventListener("pagehide", () => {
  for (const observer of ownedObservers.splice(0)) {
    try { observer.disconnect(); } catch { /* Best-effort UI teardown. */ }
  }
  for (const [control, eventName, listener] of ownedListeners.splice(0)) {
    try { control.removeEventListener(eventName, listener); } catch { /* Best-effort UI teardown. */ }
  }
}, { once: true });
