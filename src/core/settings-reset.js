import { DEFAULT_STATE } from "./storage.js";
import { normalizeSubscriptions } from "./subscriptions.js";

const EMPTY_RESET_COLLECTION = Object.freeze([]);

export function createConfiguredResetState() {
  return Object.freeze({
    enabled: DEFAULT_STATE.enabled,
    autoSubmitCommunity: DEFAULT_STATE.autoSubmitCommunity,
    updateIntervalHours: DEFAULT_STATE.updateIntervalHours,
    cookieMode: DEFAULT_STATE.cookieMode,
    cookieAllowSites: EMPTY_RESET_COLLECTION,
    personalBlock: EMPTY_RESET_COLLECTION,
    personalAllow: EMPTY_RESET_COLLECTION,
    personalCosmeticHide: EMPTY_RESET_COLLECTION,
    personalCosmeticAllow: EMPTY_RESET_COLLECTION,
    disabledSites: EMPTY_RESET_COLLECTION,
    subscriptions: normalizeSubscriptions(DEFAULT_STATE.subscriptions)
  });
}
