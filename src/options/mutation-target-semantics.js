import "./personal-mutation-feedback.js";
import "./disabled-site-feedback.js";
import "./subscription-presentation.js";

const lists = {
  block: document.querySelector("#block-list"),
  allow: document.querySelector("#allow-list"),
  subscriptions: document.querySelector("#subscription-list"),
  disabledSites: document.querySelector("#disabled-sites"),
  cookieExceptions: document.querySelector("#cookie-exception-list"),
  country: document.querySelector("#country-list"),
  cosmeticHide: document.querySelector("#cosmetic-hide-list"),
  cosmeticAllow: document.querySelector("#cosmetic-allow-list")
};
const observers = [];

function applyPersonalTargets(list, listId, isBlock = false) {
  if (!list) return;
  for (const row of list.querySelectorAll("li[data-rule-key]")) {
    const remove = row.querySelector("button.remove");
    if (remove) remove.setAttribute("aria-controls", listId);
    if (!isBlock) continue;
    for (const action of row.querySelectorAll("button.secondary-action")) {
      const text = action.textContent?.trim();
      if (text === "Remove allow override" || text === "Remove allow") action.setAttribute("aria-controls", "block-list allow-list");
      else action.removeAttribute("aria-controls");
    }
  }
}

function applySubscriptionTargets() {
  const list = lists.subscriptions;
  if (!list) return;
  for (const row of list.querySelectorAll("li.subscription-item")) {
    const checkbox = row.querySelector('input[type="checkbox"]');
    const remove = row.querySelector("button.remove");
    if (checkbox) checkbox.setAttribute("aria-controls", "subscription-list");
    if (remove) remove.setAttribute("aria-controls", "subscription-list");
  }
}

function applySimpleListTarget(list, listId, selector = "button.remove") {
  if (!list) return;
  for (const action of list.querySelectorAll(`li:not(.empty) ${selector}`)) action.setAttribute("aria-controls", listId);
}

function syncListBusy(list) {
  if (!list) return;
  const busy = list.querySelector('[aria-busy="true"]') !== null;
  if (busy) {
    if (list.getAttribute("aria-busy") !== "true") list.setAttribute("aria-busy", "true");
  } else if (list.hasAttribute("aria-busy")) {
    list.removeAttribute("aria-busy");
  }
}

function applyAll() {
  applyPersonalTargets(lists.block, "block-list", true);
  applyPersonalTargets(lists.allow, "allow-list");
  applySubscriptionTargets();
  applySimpleListTarget(lists.disabledSites, "disabled-sites");
  applySimpleListTarget(lists.cookieExceptions, "cookie-exception-list");
  applySimpleListTarget(lists.country, "country-list", "select, button.remove");
  applySimpleListTarget(lists.cosmeticHide, "cosmetic-hide-list");
  applySimpleListTarget(lists.cosmeticAllow, "cosmetic-allow-list");
  for (const list of Object.values(lists)) syncListBusy(list);
}

applyAll();
if (typeof globalThis.MutationObserver === "function") {
  for (const list of Object.values(lists)) {
    if (!list) continue;
    const observer = new globalThis.MutationObserver(applyAll);
    observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] });
    observers.push(observer);
  }
}

window.addEventListener("pagehide", () => {
  for (const observer of observers.splice(0)) {
    try { observer.disconnect(); } catch { /* Best-effort UI teardown. */ }
  }
  for (const list of Object.values(lists)) list?.removeAttribute("aria-busy");
}, { once: true });
