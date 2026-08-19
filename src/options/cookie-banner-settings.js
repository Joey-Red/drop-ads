import { isRelevantOptionsStorageChange, optionsCaughtErrorMessage } from "../core/options-boundary.js";
import { installOwnedOptionsStorageListener } from "../core/options-storage-listener.js";
import { setCookieBannerSiteDisabled } from "../core/cookie-banner-site-policy.js";
import { MAX_CANONICAL_DOMAIN_CHARS, normalizeDomain } from "../core/rules.js";
import { loadState, saveState, STORAGE_KEY } from "../core/storage.js";

const api = globalThis.browser ?? globalThis.chrome;
const section = document.querySelector("#cookie-settings");
const cookieMode = document.querySelector("#cookie-mode");
let pageActive = true;
let internalMutationDepth = 0;
let disposeStorageSync = null;

function ensureSurface() {
  const existing = document.querySelector("#cookie-banner-mode");
  if (existing) return {
    select: existing,
    status: document.querySelector("#cookie-banner-status"),
    siteInput: document.querySelector("#cookie-banner-site-input"),
    siteAdd: document.querySelector("#cookie-banner-site-add"),
    siteList: document.querySelector("#cookie-banner-site-list")
  };
  if (!section || !cookieMode) return { select: null, status: null, siteInput: null, siteAdd: null, siteList: null };

  const label = document.createElement("label");
  label.htmlFor = "cookie-banner-mode";
  label.textContent = "Cookie banner handling";
  label.className = "cookie-banner-label";

  const select = document.createElement("select");
  select.id = "cookie-banner-mode";
  select.setAttribute("aria-describedby", "cookie-banner-help cookie-banner-status");
  select.innerHTML = '<option value="reject">Reject cookie banners when possible</option><option value="off">Off</option>';

  const help = document.createElement("p");
  help.id = "cookie-banner-help";
  help.className = "hint";
  help.textContent = "When enabled, Drop Ads only activates a clearly identified visible reject/decline/necessary-only action. It does not record banners, pages, clicks, requests, statistics, or identifiers. Some sites may still require manual consent choices.";

  const siteLabel = document.createElement("label");
  siteLabel.htmlFor = "cookie-banner-site-input";
  siteLabel.textContent = "Sites where automatic cookie-banner rejection is disabled";

  const siteInput = document.createElement("input");
  siteInput.id = "cookie-banner-site-input";
  siteInput.type = "text";
  siteInput.maxLength = MAX_CANONICAL_DOMAIN_CHARS;
  siteInput.autocomplete = "off";
  siteInput.spellcheck = false;
  siteInput.placeholder = "example.com";
  siteInput.setAttribute("aria-describedby", "cookie-banner-site-help cookie-banner-status");

  const siteAdd = document.createElement("button");
  siteAdd.id = "cookie-banner-site-add";
  siteAdd.type = "button";
  siteAdd.textContent = "Disable rejection on site";
  siteAdd.setAttribute("aria-describedby", "cookie-banner-site-help cookie-banner-status");

  const siteHelp = document.createElement("p");
  siteHelp.id = "cookie-banner-site-help";
  siteHelp.className = "hint";
  siteHelp.textContent = "This only disables automatic cookie-banner clicks on that domain and its subdomains. Network, cookie, and cosmetic blocking stay configured normally.";

  const siteList = document.createElement("ul");
  siteList.id = "cookie-banner-site-list";
  siteList.setAttribute("aria-label", "Cookie-banner site exclusions");

  const status = document.createElement("p");
  status.id = "cookie-banner-status";
  status.className = "hint";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  const anchor = cookieMode.nextElementSibling;
  const nodes = [label, select, help, siteLabel, siteInput, siteAdd, siteHelp, siteList, status];
  if (anchor) anchor.after(...nodes);
  else section.append(...nodes);
  return { select, status, siteInput, siteAdd, siteList };
}

const { select, status, siteInput, siteAdd, siteList } = ensureSurface();

function renderSiteList(domains) {
  if (!siteList) return;
  siteList.replaceChildren();
  for (const domain of domains) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = domain;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.cookieBannerDomain = domain;
    remove.setAttribute("aria-label", `Remove cookie-banner exclusion for ${domain}`);
    item.append(text, remove);
    siteList.append(item);
  }
}

async function render() {
  if (!pageActive || !select) return false;
  const state = await loadState(api);
  if (!pageActive) return false;
  select.value = state.cookieBannerMode;
  renderSiteList(state.cookieBannerDisabledSites);
  if (siteInput) siteInput.disabled = state.cookieBannerMode === "off";
  if (siteAdd) siteAdd.disabled = state.cookieBannerMode === "off";
  return true;
}

async function persist() {
  if (!select || !status) return;
  const desired = select.value;
  if (desired !== "off" && desired !== "reject") return;
  select.disabled = true;
  select.setAttribute("aria-busy", "true");
  status.textContent = "Saving cookie-banner preference…";
  try {
    internalMutationDepth += 1;
    try {
      const state = await loadState(api);
      await saveState(api, { ...state, cookieBannerMode: desired });
    } finally {
      internalMutationDepth -= 1;
    }
    if (pageActive) status.textContent = desired === "reject"
      ? "Cookie-banner rejection is enabled locally."
      : "Cookie-banner rejection is off.";
    await render();
  } catch (error) {
    if (pageActive) status.textContent = optionsCaughtErrorMessage(error, "Could not save cookie-banner preference");
    await render().catch(() => undefined);
  } finally {
    if (select.isConnected) {
      select.removeAttribute("aria-busy");
      select.disabled = false;
    }
  }
}

async function addSiteExclusion() {
  if (!siteInput || !siteAdd || !status || siteAdd.disabled) return;
  let domain;
  try { domain = normalizeDomain(siteInput.value.trim()); }
  catch {
    status.textContent = "Enter a valid domain such as example.com.";
    return;
  }
  siteAdd.disabled = true;
  siteInput.disabled = true;
  status.textContent = `Disabling automatic cookie-banner rejection on ${domain}…`;
  try {
    internalMutationDepth += 1;
    try { await setCookieBannerSiteDisabled(api, domain, true); }
    finally { internalMutationDepth -= 1; }
    if (pageActive) {
      siteInput.value = "";
      status.textContent = `Automatic cookie-banner rejection is disabled on ${domain} and its subdomains.`;
    }
    await render();
  } catch (error) {
    if (pageActive) status.textContent = optionsCaughtErrorMessage(error, "Could not add cookie-banner site exclusion");
    await render().catch(() => undefined);
  } finally {
    if (pageActive && siteAdd.isConnected && select?.value === "reject") siteAdd.disabled = false;
    if (pageActive && siteInput.isConnected && select?.value === "reject") siteInput.disabled = false;
  }
}

async function removeSiteExclusion(domain) {
  if (!status) return;
  status.textContent = `Removing cookie-banner exclusion for ${domain}…`;
  try {
    internalMutationDepth += 1;
    try { await setCookieBannerSiteDisabled(api, domain, false); }
    finally { internalMutationDepth -= 1; }
    if (pageActive) status.textContent = `Automatic cookie-banner rejection is enabled again on ${domain}.`;
    await render();
  } catch (error) {
    if (pageActive) status.textContent = optionsCaughtErrorMessage(error, "Could not remove cookie-banner site exclusion");
    await render().catch(() => undefined);
  }
}

function onSiteListClick(event) {
  const target = event.target;
  const domain = target?.dataset?.cookieBannerDomain;
  if (typeof domain !== "string" || !domain) return;
  void removeSiteExclusion(domain);
}

function onSiteInputKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  void addSiteExclusion();
}

select?.addEventListener("change", persist);
siteAdd?.addEventListener("click", addSiteExclusion);
siteInput?.addEventListener("keydown", onSiteInputKeydown);
siteList?.addEventListener("click", onSiteListClick);
await render().catch((error) => {
  if (pageActive && status) status.textContent = optionsCaughtErrorMessage(error, "Could not load cookie-banner preference");
});

try {
  disposeStorageSync = installOwnedOptionsStorageListener(api, (changes, areaName) => {
    if (!pageActive || internalMutationDepth > 0) return;
    if (!isRelevantOptionsStorageChange(changes, areaName, STORAGE_KEY)) return;
    void render().catch(() => undefined);
  });
} catch {
  disposeStorageSync = null;
}

window.addEventListener("pagehide", () => {
  pageActive = false;
  select?.removeEventListener("change", persist);
  siteAdd?.removeEventListener("click", addSiteExclusion);
  siteInput?.removeEventListener("keydown", onSiteInputKeydown);
  siteList?.removeEventListener("click", onSiteListClick);
  try { disposeStorageSync?.(); } catch { /* Best-effort Settings teardown. */ }
  disposeStorageSync = null;
}, { once: true });
