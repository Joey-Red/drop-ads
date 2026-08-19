import { setDomainFlag } from "./personal-rules.js";
import { normalizeDomain } from "./rules.js";
import { loadState, saveState } from "./storage.js";

export async function setCookieBannerSiteDisabled(api, domain, disabled) {
  if (typeof disabled !== "boolean") throw new TypeError("Cookie-banner site disabled state must be boolean");
  const normalizedDomain = normalizeDomain(domain);
  const state = await loadState(api);
  const nextSites = setDomainFlag(state.cookieBannerDisabledSites, normalizedDomain, disabled);
  const changed = JSON.stringify(nextSites) !== JSON.stringify(state.cookieBannerDisabledSites);
  if (changed) await saveState(api, { ...state, cookieBannerDisabledSites: nextSites });
  return Object.freeze({ domain: normalizedDomain, disabled, changed });
}
