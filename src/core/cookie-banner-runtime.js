import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";
import { normalizeDomain } from "./rules.js";
import { loadSessionState } from "./session.js";
import { loadState } from "./storage.js";

const REQUEST_KEYS = new Set(["type", "domain"]);
const MESSAGE_TYPE = "drop-ads:get-cookie-banner-policy";
const MAX_SENDER_URL_CHARS = 16_384;
const DISABLED_POLICY = Object.freeze({ enabled: false });

function snapshotRequest(message) {
  assertPlainExactObject(message, "Cookie-banner policy request", REQUEST_KEYS);
  const type = readPlainDataField(message, "type");
  const domain = readPlainDataField(message, "domain");
  if (!type.safe || !type.present || type.value !== MESSAGE_TYPE) return null;
  if (!domain.safe || !domain.present || typeof domain.value !== "string") return null;
  const normalizedDomain = normalizeDomain(domain.value);
  if (normalizedDomain !== domain.value) return null;
  return Object.freeze({ domain: normalizedDomain });
}

function senderMatchesRequest(sender, request, extensionId) {
  const frameId = readPlainDataField(sender, "frameId");
  const senderUrl = readPlainDataField(sender, "url");
  const senderId = readPlainDataField(sender, "id");
  if (!frameId.safe || !frameId.present || frameId.value !== 0) return false;
  if (!senderUrl.safe || !senderUrl.present || typeof senderUrl.value !== "string"
    || !senderUrl.value || senderUrl.value.length > MAX_SENDER_URL_CHARS) return false;
  if (extensionId) {
    if (!senderId.safe || !senderId.present || senderId.value !== extensionId) return false;
  }

  let parsed;
  try { parsed = new URL(senderUrl.value); }
  catch { return false; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (!parsed.hostname || parsed.hostname !== request.domain) return false;
  try {
    return normalizeDomain(parsed.hostname) === request.domain;
  } catch {
    return false;
  }
}

function domainCoveredBy(values, domain) {
  for (const candidate of values ?? []) {
    if (domain === candidate || domain.endsWith(`.${candidate}`)) return true;
  }
  return false;
}

export function installCookieBannerRuntime({ api }) {
  if (!api?.runtime?.onMessage) throw new TypeError("Cookie-banner runtime requires runtime.onMessage");
  const extensionId = typeof api.runtime.id === "string" ? api.runtime.id : "";
  let active = true;

  const listener = (message, sender) => {
    let request;
    try { request = snapshotRequest(message); }
    catch { request = null; }
    if (!request || !active || !senderMatchesRequest(sender, request, extensionId)) return false;

    return Promise.all([loadState(api), loadSessionState(api)])
      .then(([state, session]) => Object.freeze({
        enabled: state.enabled === true
          && state.cookieBannerMode === "reject"
          && !domainCoveredBy(state.cookieBannerDisabledSites, request.domain)
          && !domainCoveredBy(state.disabledSites, request.domain)
          && !domainCoveredBy(session.disabledSites, request.domain)
      }))
      .catch(() => DISABLED_POLICY);
  };

  api.runtime.onMessage.addListener(listener);
  return () => {
    active = false;
    try { api.runtime.onMessage.removeListener(listener); } catch { /* Best-effort runtime teardown. */ }
  };
}
