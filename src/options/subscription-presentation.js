import { subscriptionCommitStatus } from "../core/ui-commit-status.js";

const subscriptionList = document.querySelector("#subscription-list");
const subscriptionForm = document.querySelector("#subscription-form");
let subscriptionPresentationObserver = null;

function ensureNote(info, className) {
  let note = info.querySelector(`.${className}`);
  if (!note) {
    note = document.createElement("span");
    note.className = `rule-note ${className}`;
    info.append(note);
  }
  return note;
}

function setTextIfChanged(node, text) {
  if (node.textContent === text) return false;
  node.textContent = text;
  return true;
}

function appendDescription(control, id) {
  if (!control || !id) return;
  const ids = new Set((control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  ids.add(id);
  control.setAttribute("aria-describedby", [...ids].join(" "));
}

function installExternalSourceGuidance() {
  if (!subscriptionForm) return;
  const row = subscriptionForm.querySelector(".subscription-row");
  if (!row) return;
  let help = document.querySelector("#subscription-source-help");
  if (!help) {
    help = document.createElement("p");
    help.id = "subscription-source-help";
    help.className = "hint";
    help.textContent = "External lists must use a public HTTPS source. The source URL is stored locally; enabling or refreshing the list may contact that source directly. No Drop Ads server is involved.";
    row.before(help);
  }
  for (const selector of ["#subscription-url", "#subscription-format", "#subscription-form button[type=\"submit\"]"]) {
    appendDescription(document.querySelector(selector), help.id);
  }
}

function checkboxBusy(checkbox) {
  return checkbox.disabled || checkbox.getAttribute("aria-busy") === "true";
}

function enhanceSubscriptionPresentation() {
  if (!subscriptionList) return;
  for (const row of subscriptionList.querySelectorAll("li.subscription-item")) {
    const info = row.querySelector("div:first-child");
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!info || !checkbox) continue;
    const removable = Boolean(row.querySelector("button.remove"));
    setTextIfChanged(ensureNote(info, "subscription-origin-note"), removable ? "External HTTPS list" : "Built-in list");
    setTextIfChanged(
      ensureNote(info, "subscription-state-note"),
      subscriptionCommitStatus(Boolean(checkbox.checked), checkboxBusy(checkbox))
    );
    setTextIfChanged(
      ensureNote(info, "subscription-activation-note"),
      "Enabled lists contribute blocking rules when the popup master Blocking switch is on."
    );
    if (!removable) {
      setTextIfChanged(ensureNote(info, "subscription-management-note"), "Built-in source stays configured; turn Enabled off to stop using it.");
    } else {
      info.querySelector(".subscription-management-note")?.remove();
    }
  }
}

function handleSubscriptionStateChange(event) {
  const checkbox = event.target?.closest?.('input[type="checkbox"]');
  if (!checkbox || !subscriptionList?.contains(checkbox)) return;
  enhanceSubscriptionPresentation();
}

installExternalSourceGuidance();
enhanceSubscriptionPresentation();
if (subscriptionList && typeof globalThis.MutationObserver === "function") {
  subscriptionList.addEventListener("change", handleSubscriptionStateChange);
  subscriptionPresentationObserver = new globalThis.MutationObserver(enhanceSubscriptionPresentation);
  subscriptionPresentationObserver.observe(subscriptionList, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "aria-busy"]
  });
}

window.addEventListener("pagehide", () => {
  try { subscriptionPresentationObserver?.disconnect(); } catch { /* Best-effort Settings teardown. */ }
  subscriptionPresentationObserver = null;
  subscriptionList?.removeEventListener("change", handleSubscriptionStateChange);
}, { once: true });
